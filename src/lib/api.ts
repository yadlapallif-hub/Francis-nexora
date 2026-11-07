import { z } from 'zod'
import { supabaseAnonKey, supabaseUrl } from './supabase'

const providerSchema = z.object({ provider: z.literal('Ollama Cloud'), model: z.string().nullable(), configured: z.boolean() })
const testSchema = z.object({ ok: z.literal(true), provider: z.literal('Ollama Cloud'), model: z.string() })
const chatSchema = z.object({ message: z.string().min(1).max(12000), requestId: z.string().uuid(), replayed: z.boolean() })
const errorSchema = z.object({ error: z.object({ code: z.string(), message: z.string() }) })

export class ApiError extends Error {
  constructor(message: string, public code = 'UNKNOWN') { super(message) }
}
async function request(token: string, body: Record<string, unknown>) {
  let response: Response
  try {
    response = await fetch(`${supabaseUrl}/functions/v1/nexora-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: supabaseAnonKey, Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Could not reach the AI service. Check your connection and try again.', 'OFFLINE')
  }
  let data: unknown
  try { data = await response.json() } catch { throw new ApiError('The AI service returned an invalid response.', 'INVALID_RESPONSE') }
  if (!response.ok) {
    const parsed = errorSchema.safeParse(data)
    throw new ApiError(parsed.success ? parsed.data.error.message : 'The AI service could not process your request.', parsed.success ? parsed.data.error.code : 'SERVICE_ERROR')
  }
  return data
}
export async function getProviderStatus(token: string) {
  const parsed = providerSchema.safeParse(await request(token, { action: 'status' }))
  if (!parsed.success) throw new ApiError('The AI service returned an invalid status.', 'INVALID_RESPONSE')
  return parsed.data
}
export async function testProvider(token: string) {
  const parsed = testSchema.safeParse(await request(token, { action: 'test' }))
  if (!parsed.success) throw new ApiError('The connection test returned an invalid response.', 'INVALID_RESPONSE')
  return parsed.data
}
export async function sendChat(token: string, conversationId: string, requestId: string, message: string) {
  const parsed = chatSchema.safeParse(await request(token, { action: 'chat', conversationId, requestId, message }))
  if (!parsed.success) throw new ApiError('The AI service returned an invalid message.', 'INVALID_RESPONSE')
  return parsed.data
}
export function safeError(error: unknown, fallback = 'Something went wrong. Please try again.') {
  return error instanceof Error && error.message ? error.message : fallback
}
