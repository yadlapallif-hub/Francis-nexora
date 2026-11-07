// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { handleRequest, type Environment } from '../supabase/functions/nexora-chat/index'

const userId = '11111111-1111-4111-8111-111111111111'
const conversationId = '22222222-2222-4222-8222-222222222222'
const requestId = '33333333-3333-4333-8333-333333333333'
const leaseId = '44444444-4444-4444-8444-444444444444'
const origin = 'https://app.example.test'
const env: Environment = { SUPABASE_URL: 'https://db.example.test', SUPABASE_ANON_KEY: 'public-anon', SUPABASE_SERVICE_ROLE_KEY: 'private-service-key', OLLAMA_API_KEY: 'private-provider-key', OLLAMA_MODEL: 'test-model:latest', NEXORA_APP_ORIGIN: `${origin},http://localhost:5173` }
const ok = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } })
function request(body: unknown, options: { auth?: string; origin?: string; contentType?: string } = {}) {
  return new Request('https://edge.example.test/nexora-chat', { method: 'POST', headers: { origin: options.origin ?? origin, authorization: options.auth ?? 'Bearer valid-token', 'content-type': options.contentType ?? 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) })
}
type Row = { id: string; request_id: string; role: 'user' | 'assistant'; content: string; created_at: string; conversation_id: string; user_id: string }
function backend(opts: { providerStatus?: number; providerBody?: unknown; timeout?: boolean; noConversation?: boolean; claimError?: string } = {}) {
  const messages: Row[] = []
  const audit: unknown[] = []
  const releases: unknown[] = []
  const providerCalls: { headers: Headers; body: Record<string, unknown> }[] = []
  const fetcher = vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
    const method = init.method || 'GET'
    const headers = new Headers(init.headers)
    if (url.pathname === '/auth/v1/user') return headers.get('authorization') === 'Bearer valid-token' ? ok({ id: userId }) : ok({ message: 'bad token' }, 401)
    if (url.pathname === '/api/chat') {
      providerCalls.push({ headers, body: JSON.parse(String(init.body)) })
      if (opts.timeout) return await new Promise<Response>((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(new Error('aborted'))))
      if (opts.providerStatus) return ok({ error: 'internal diagnostic: never expose' }, opts.providerStatus)
      return ok(opts.providerBody ?? { message: { role: 'assistant', content: 'A real-looking **mock** response.' } })
    }
    if (url.pathname.endsWith('/nexora_conversations')) return ok(opts.noConversation ? [] : [{ id: conversationId }])
    if (url.pathname.endsWith('/rpc/nexora_claim_chat_request')) return opts.claimError ? ok({ message: opts.claimError }, 400) : ok(leaseId)
    if (url.pathname.endsWith('/nexora_messages')) {
      if (method === 'POST') {
        expect(headers.get('authorization')).toBe('Bearer private-service-key')
        const row = JSON.parse(String(init.body)) as Omit<Row, 'id' | 'created_at'>
        const saved: Row = { ...row, id: `row-${messages.length}`, created_at: new Date(1_700_000_000_000 + messages.length * 1000).toISOString() }
        messages.push(saved)
        return ok([saved], 201)
      }
      const requested = url.searchParams.get('request_id')?.replace('eq.', '')
      const before = url.searchParams.get('created_at')?.replace('lte.', '')
      const result = messages.filter((m) => (!requested || m.request_id === requested) && (!before || m.created_at <= before))
      return ok(url.searchParams.has('order') ? [...result].reverse() : result)
    }
    if (url.pathname.endsWith('/nexora_chat_requests')) { releases.push(JSON.parse(String(init.body))); return ok([]) }
    if (url.pathname.endsWith('/nexora_audit_events')) { audit.push(JSON.parse(String(init.body))); return ok([]) }
    throw new Error(`Unexpected mock endpoint ${url.pathname}`)
  }) as unknown as typeof fetch
  return { fetcher, messages, audit, releases, providerCalls }
}
const chat = { action: 'chat', conversationId, requestId, message: 'Help me make a plan.' }

describe('nexora-chat secure gateway (mocked services)', () => {
  it('enforces an exact origin and handles preflight without a wildcard', async () => {
    const mock = backend()
    const allowed = await handleRequest(new Request('https://edge.example.test', { method: 'OPTIONS', headers: { origin } }), env, mock.fetcher)
    expect(allowed.status).toBe(204)
    expect(allowed.headers.get('access-control-allow-origin')).toBe(origin)
    const denied = await handleRequest(request({ action: 'status' }, { origin: 'https://evil.example.test' }), env, mock.fetcher)
    expect(denied.status).toBe(403)
    expect(denied.headers.get('access-control-allow-origin')).toBeNull()
    expect(mock.fetcher).not.toHaveBeenCalled()
  })
  it('requires a valid user and reports configuration without revealing credentials or claiming a connection', async () => {
    const mock = backend()
    const unauth = await handleRequest(request({ action: 'status' }, { auth: 'Bearer bad' }), env, mock.fetcher)
    expect(unauth.status).toBe(401)
    const response = await handleRequest(request({ action: 'status' }), env, mock.fetcher)
    const text = await response.text()
    expect(JSON.parse(text)).toEqual({ provider: 'Ollama Cloud', model: 'test-model:latest', configured: true })
    expect(text).not.toContain('private-provider-key')
    expect(text).not.toContain('private-service-key')
    expect(mock.providerCalls).toHaveLength(0)
  })
  it('refuses chat when the provider key or model is absent or invalid', async () => {
    const mock = backend()
    const result = await handleRequest(request(chat), { ...env, OLLAMA_API_KEY: undefined }, mock.fetcher)
    expect(result.status).toBe(503)
    expect((await result.json()).error.code).toBe('PROVIDER_NOT_CONFIGURED')
    expect(mock.messages).toHaveLength(0)
    const status = await handleRequest(request({ action: 'status' }), { ...env, OLLAMA_MODEL: 'bad model!' }, mock.fetcher)
    expect(await status.json()).toEqual({ provider: 'Ollama Cloud', model: null, configured: false })
  })
  it('persists both messages, uses the server-only key, releases the lease, and replays retries idempotently', async () => {
    const mock = backend()
    const response = await handleRequest(request(chat), env, mock.fetcher)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.message).toContain('mock')
    expect(JSON.stringify(data)).not.toContain('private-provider-key')
    expect(mock.messages.map((m) => m.role)).toEqual(['user', 'assistant'])
    expect(mock.providerCalls[0].headers.get('authorization')).toBe('Bearer private-provider-key')
    expect(mock.providerCalls[0].body.stream).toBe(false)
    expect(mock.releases).toEqual([expect.objectContaining({ status: 'finished' })])
    expect(mock.audit).toEqual([expect.objectContaining({ event_type: 'chat.succeeded' })])
    const replay = await handleRequest(request(chat), env, mock.fetcher)
    expect((await replay.json()).replayed).toBe(true)
    expect(mock.providerCalls).toHaveLength(1)
    const changed = await handleRequest(request({ ...chat, message: 'A different message.' }), env, mock.fetcher)
    expect(changed.status).toBe(409)
  })
  it('rejects inaccessible conversations and never calls the provider', async () => {
    const mock = backend({ noConversation: true })
    const result = await handleRequest(request(chat), env, mock.fetcher)
    expect(result.status).toBe(404)
    expect(mock.providerCalls).toHaveLength(0)
    expect(mock.messages).toHaveLength(0)
  })
  it.each([[429, 'PROVIDER_RATE_LIMIT'], [401, 'PROVIDER_AUTH'], [404, 'PROVIDER_ERROR']])('sanitizes provider HTTP %i', async (status, code) => {
    const mock = backend({ providerStatus: status as number })
    const result = await handleRequest(request(chat), env, mock.fetcher)
    const text = await result.text()
    expect(JSON.parse(text).error.code).toBe(code)
    expect(text).not.toContain('internal diagnostic')
    expect(text).not.toContain('private-provider-key')
    expect(mock.messages.map((m) => m.role)).toEqual(['user'])
    expect(mock.releases).toEqual([expect.objectContaining({ status: 'failed' })])
  })
  it('handles timeouts and malformed model output', async () => {
    const timed = backend({ timeout: true })
    const timeout = await handleRequest(request({ action: 'test' }), env, timed.fetcher, 10)
    expect(timeout.status).toBe(504)
    expect((await timeout.json()).error.code).toBe('PROVIDER_TIMEOUT')
    const malformed = backend({ providerBody: { message: { role: 'user', content: '' } } })
    const invalid = await handleRequest(request({ action: 'test' }), env, malformed.fetcher)
    expect(invalid.status).toBe(502)
    expect((await invalid.json()).error.code).toBe('PROVIDER_INVALID_RESPONSE')
  })
  it('rejects known secrets, oversized requests, and unsupported content types before provider use', async () => {
    const mock = backend()
    const secret = await handleRequest(request({ ...chat, message: `Bearer ${'x'.repeat(30)}` }), env, mock.fetcher)
    expect((await secret.json()).error.code).toBe('POSSIBLE_SECRET')
    const big = await handleRequest(request('x'.repeat(21_000)), env, mock.fetcher)
    expect(big.status).toBe(413)
    const type = await handleRequest(request(chat, { contentType: 'text/plain' }), env, mock.fetcher)
    expect(type.status).toBe(415)
    expect(mock.providerCalls).toHaveLength(0)
  })
  it.each([['NEXORA_BUSY', 409], ['NEXORA_RATE_LIMIT', 429]])('surfaces database guard %s safely', async (guard, expectedStatus) => {
    const mock = backend({ claimError: guard as string })
    const result = await handleRequest(request(chat), env, mock.fetcher)
    expect(result.status).toBe(expectedStatus)
    expect(mock.providerCalls).toHaveLength(0)
  })
})
