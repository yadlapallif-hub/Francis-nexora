import { NextRequest } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getPortfolioData } from '@/lib/content';
import { webSearch } from '@/lib/ai/search';
import { buildSystemPrompt, buildFrancisContext, questionNeedsFreshInfo, DEFAULT_PERSONALITY, DEFAULT_WELCOME } from '@/lib/ai/prompts';
import { checkHourlyLimit, logUsage } from '@/lib/ai/ratelimit';
import type { ChatMode, SearchSource } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const TOKEN_RE = /^[A-Za-z0-9_-]{8,80}$/;
const VALID_MODES: ChatMode[] = ['general', 'portfolio', 'research', 'programming'];

function sse(payload: Record<string, unknown>) {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

function jsonError(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
  return Response.json({ code, message, ...extra }, { status });
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();

  let body: {
    message?: string;
    sessionId?: string;
    ownerToken?: string;
    mode?: ChatMode;
    documentId?: string | null;
    regenerate?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'bad_request', 'Request body must be valid JSON.');
  }

  const ownerToken = String(body.ownerToken ?? '');
  if (!TOKEN_RE.test(ownerToken)) {
    return jsonError(400, 'bad_owner_token', 'Missing or invalid owner token.');
  }

  const mode: ChatMode = VALID_MODES.includes(body.mode as ChatMode) ? (body.mode as ChatMode) : 'general';
  const message = String(body.message ?? '').trim();
  const regenerate = Boolean(body.regenerate);

  if (!regenerate && (!message || message.length > 8000)) {
    return jsonError(400, 'bad_message', 'Message must be between 1 and 8000 characters.');
  }

  const sb = getAdminSupabase();
  if (!sb) {
    return jsonError(503, 'supabase_not_configured', 'The platform database is not configured on the server.');
  }

  // 1) AI settings
  const { data: settingsRow } = await sb.from('ai_settings').select('*').eq('id', 1).maybeSingle();
  const settings = settingsRow ?? {
    enabled: true,
    provider: 'openai-compatible',
    model: 'gpt-4o-mini',
    web_search: true,
    max_response_tokens: 2048,
    hourly_limit: 30,
    allowed_uploads: ['pdf', 'txt', 'docx'],
    personality: DEFAULT_PERSONALITY,
    welcome_message: DEFAULT_WELCOME,
    allow_admin_content_view: false,
  };

  if (!settings.enabled) {
    return jsonError(503, 'ai_disabled', 'FRANCIS AI is currently disabled by the platform administrator.');
  }

  // 2) Provider configuration — never fake a response when unconfigured
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = (process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/+$/, '');
  const model = process.env.AI_MODEL || settings.model || 'gpt-4o-mini';

  if (!apiKey) {
    return jsonError(503, 'ai_not_configured', 'FRANCIS AI is not configured yet. The site owner can activate it by adding OPENAI_API_KEY (or an OpenAI-compatible provider key) to the server environment. No simulated responses are shown.');
  }

  // 3) Hourly rate limit
  const rl = await checkHourlyLimit(ownerToken, settings.hourly_limit ?? 30);
  if (!rl.ok) {
    return jsonError(429, 'rate_limited', 'You have reached the hourly message limit for FRANCIS AI. Please try again shortly.', { retryAfterSeconds: rl.retryAfterSeconds });
  }

  // 4) Resolve or create the chat session
  let sessionId = body.sessionId ?? null;
  if (sessionId) {
    const { data: session } = await sb
      .from('chat_sessions')
      .select('id, owner_token')
      .eq('id', sessionId)
      .maybeSingle();
    if (!session || session.owner_token !== ownerToken) {
      return jsonError(403, 'session_forbidden', 'This conversation does not belong to you.');
    }
  } else {
    const title = message.replace(/\s+/g, ' ').slice(0, 72) || 'New conversation';
    const { data: created, error: createErr } = await sb
      .from('chat_sessions')
      .insert({ owner_token: ownerToken, title, mode })
      .select('id')
      .single();
    if (createErr || !created) {
      return jsonError(500, 'session_create_failed', 'Could not create a conversation.');
    }
    sessionId = created.id as string;
  }

  // 5) Optional uploaded document context (owner-scoped)
  let documentExcerpt: string | null = null;
  let documentName: string | null = null;
  if (body.documentId) {
    const { data: doc } = await sb
      .from('knowledge_documents')
      .select('name, extracted_text, owner_token')
      .eq('id', body.documentId)
      .maybeSingle();
    if (doc && doc.owner_token === ownerToken && typeof doc.extracted_text === 'string') {
      documentName = doc.name;
      documentExcerpt = doc.extracted_text.slice(0, 14000);
    }
  }

  // 6) Live web search when the question needs fresh information
  const searchWanted =
    Boolean(settings.web_search) && (mode === 'research' || (message ? questionNeedsFreshInfo(message) : false));
  let sources: SearchSource[] = [];
  if (searchWanted && message) {
    sources = await webSearch(message);
  }

  // 7) Conversation history (last 16 turns) + system prompt
  const { data: historyRows } = await sb
    .from('chat_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(16);
  const history = ((historyRows ?? []) as Array<{ role: string; content: string }>)
    .reverse()
    .map((row) => ({ role: row.role as 'user' | 'assistant' | 'system', content: row.content }));

  const portfolio = await getPortfolioData();
  const systemPrompt = buildSystemPrompt({
    mode,
    personality: settings.personality || DEFAULT_PERSONALITY,
    francisContext: buildFrancisContext(portfolio),
    sources,
    searchAttempted: searchWanted && Boolean(message),
    documentExcerpt,
    documentName,
  });

  const upstreamMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...history,
    ...(message ? [{ role: 'user' as const, content: message }] : []),
  ];

  // 8) Call the LLM provider (streaming)
  let upstream: globalThis.Response;
  try {
    upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      signal: AbortSignal.timeout(55_000),
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: true,
        max_tokens: settings.max_response_tokens ?? 2048,
        temperature: 0.6,
        messages: upstreamMessages,
      }),
    });
  } catch (error) {
    await logUsage({ ownerToken, sessionId, mode, tokensIn: 0, tokensOut: 0, latencyMs: Date.now() - startedAt, searchUsed: sources.length > 0, error: `provider_unreachable: ${String(error).slice(0, 300)}` });
    return jsonError(502, 'provider_unreachable', 'The AI provider could not be reached. Please try again in a moment.');
  }

  if (!upstream.ok || !upstream.body) {
    let detail = `HTTP ${upstream.status}`;
    try {
      const text = await upstream.text();
      try {
        const parsed = JSON.parse(text);
        detail = parsed?.error?.message ?? parsed?.message ?? text.slice(0, 300);
      } catch {
        detail = text.slice(0, 300);
      }
    } catch {
      /* keep default */
    }
    console.error('[ai] provider error:', upstream.status, detail);
    await logUsage({ ownerToken, sessionId, mode, tokensIn: 0, tokensOut: 0, latencyMs: Date.now() - startedAt, searchUsed: sources.length > 0, error: `provider_${upstream.status}: ${detail}`.slice(0, 400) });
    return jsonError(502, 'provider_error', `The AI provider rejected the request (${upstream.status}). Check the provider key and model configured on the server.`);
  }

  // 9) Persist the user message only after the provider accepted the request
  const tokensIn = Math.ceil((systemPrompt.length + history.reduce((a, m) => a + m.content.length, 0) + message.length) / 4);
  if (message && !regenerate) {
    await sb.from('chat_messages').insert({ session_id: sessionId, role: 'user', content: message, mode });
  }

  const encoder = new TextEncoder();
  const sid = sessionId as string;
  let full = '';

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(sse({ type: 'meta', sessionId: sid, model }));
      if (sources.length) controller.enqueue(sse({ type: 'sources', sources }));

      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const finish = async (aborted: boolean) => {
        const tokensOut = Math.ceil(full.length / 4);
        if (full.trim()) {
          await sb.from('chat_messages').insert({
            session_id: sid,
            role: 'assistant',
            content: aborted ? `${full}\n\n*(generation stopped)*` : full,
            sources: sources.length ? sources : null,
            mode,
          });
        }
        await sb.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sid);
        await logUsage({ ownerToken, sessionId: sid, mode, tokensIn, tokensOut, latencyMs: Date.now() - startedAt, searchUsed: sources.length > 0, error: null });
        controller.enqueue(sse({ type: 'done', sessionId: sid, stopped: aborted }));
        controller.close();
      };

      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (payload === '[DONE]') {
              await finish(false);
              return;
            }
            try {
              const json = JSON.parse(payload);
              const delta: string | undefined = json?.choices?.[0]?.delta?.content ?? json?.choices?.[0]?.message?.content;
              if (delta) {
                full += delta;
                controller.enqueue(sse({ type: 'token', text: delta }));
              }
            } catch {
              /* partial JSON line — ignore */
            }
          }
        }
        await finish(false);
      } catch (error) {
        console.error('[ai] stream failed:', error);
        try {
          await finish(true);
        } catch {
          controller.enqueue(sse({ type: 'error', code: 'stream_failed', message: 'The stream ended unexpectedly.' }));
          controller.close();
        }
      }
    },
    cancel() {
      // Client disconnected — upstream reader will be GC'd; nothing to persist beyond what finish() writes.
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    },
  });
}
