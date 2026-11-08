import { createServiceClient } from '@/lib/supabase/admin';
import { getSiteContent, buildFrancisContext } from '@/lib/content';
import { getAiEnv } from '@/lib/ai/config';
import { webSearch, needsLiveInformation, type SearchSource } from '@/lib/ai/search';
import { buildSystemPrompt, type ChatMode } from '@/lib/ai/prompts';
import type { AiSettings } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODES: ChatMode[] = ['general', 'portfolio', 'research', 'programming'];
const MAX_MESSAGE_CHARS = 8000;
const HISTORY_LIMIT = 18;
const DOC_CONTEXT_LIMIT = 12000;

type ChatRequest = {
  ownerToken?: string;
  sessionId?: string | null;
  mode?: string;
  message?: string;
  regenerate?: boolean;
  documentId?: string | null;
};

function jsonError(status: number, code: string, message: string, extra?: Record<string, unknown>) {
  return Response.json({ error: code, message, ...extra }, { status });
}

function sseEvent(event: string, payload: unknown): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
}

export async function POST(req: Request) {
  const started = Date.now();
  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return jsonError(400, 'bad_request', 'The request body was not valid JSON.');
  }

  const ownerToken = (body.ownerToken ?? '').trim();
  const message = (body.message ?? '').trim();
  const regenerate = Boolean(body.regenerate);
  const documentId = body.documentId?.trim() || null;
  const mode: ChatMode = MODES.includes(body.mode as ChatMode) ? (body.mode as ChatMode) : 'general';

  if (!ownerToken || ownerToken.length > 128) {
    return jsonError(400, 'owner_token_required', 'A conversation owner token is required.');
  }
  if (!regenerate && !message) {
    return jsonError(400, 'empty_message', 'Please type a message before sending.');
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return jsonError(400, 'message_too_long', `Messages are limited to ${MAX_MESSAGE_CHARS} characters.`);
  }

  let supabase;
  try {
    supabase = createServiceClient();
  } catch {
    return jsonError(500, 'server_not_configured', 'The server is missing SUPABASE_SERVICE_ROLE_KEY. Set it in the deployment environment.');
  }

  // ── AI settings ──────────────────────────────────────────────
  const { data: aiRow } = await supabase.from('ai_settings').select('*').eq('id', 1).maybeSingle();
  const ai = (aiRow as AiSettings | null) ?? {
    id: 1, enabled: true, provider: 'openai-compatible', model: 'gpt-4o-mini',
    web_search: true, max_response_tokens: 2048, hourly_limit: 30,
    allowed_uploads: ['pdf', 'txt', 'docx'], personality: '', welcome_message: '',
    allow_admin_content_view: false,
  };
  if (!ai.enabled) {
    return jsonError(503, 'ai_disabled', 'FRANCIS AI is temporarily disabled by the administrator. Please try again later.');
  }

  const env = getAiEnv();
  if (!env.apiKey) {
    return jsonError(
      503,
      'ai_not_configured',
      'FRANCIS AI is not connected to a language model yet. The platform owner can enable it by adding AI_API_KEY (and optionally AI_BASE_URL / AI_MODEL) to the server environment — nothing else needs to change.',
    );
  }
  const model = env.modelOverride || ai.model || 'gpt-4o-mini';

  // ── Resolve / create session ─────────────────────────────────
  let sessionId = body.sessionId?.trim() || null;
  if (sessionId) {
    const { data: existing } = await supabase
      .from('chat_sessions')
      .select('id, owner_token')
      .eq('id', sessionId)
      .maybeSingle();
    if (!existing || existing.owner_token !== ownerToken) {
      return jsonError(404, 'session_not_found', 'That conversation could not be found.');
    }
  } else {
    const title = (message || 'New conversation').slice(0, 64);
    const { data: created, error: createErr } = await supabase
      .from('chat_sessions')
      .insert({ owner_token: ownerToken, title, mode })
      .select('id')
      .single();
    if (createErr || !created) {
      return jsonError(500, 'session_create_failed', 'Could not start a new conversation. Please try again.');
    }
    sessionId = created.id as string;
  }

  // ── Regenerate: drop trailing assistant messages ─────────────
  if (regenerate) {
    const { data: lastUser } = await supabase
      .from('chat_messages')
      .select('created_at')
      .eq('session_id', sessionId)
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastUser?.created_at) {
      await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', sessionId)
        .eq('role', 'assistant')
        .gt('created_at', lastUser.created_at);
    }
  } else {
    await supabase.from('chat_messages').insert({ session_id: sessionId, role: 'user', content: message, mode });
  }

  // ── Rate limit (per owner token, rolling hour) ───────────────
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('ai_usage_logs')
    .select('id', { count: 'exact', head: true })
    .eq('owner_token', ownerToken)
    .gt('created_at', hourAgo);
  if ((count ?? 0) >= (ai.hourly_limit ?? 30)) {
    return jsonError(429, 'rate_limited', `You have reached the hourly limit of ${ai.hourly_limit} requests. Please wait a little and try again.`);
  }

  // ── Load history ─────────────────────────────────────────────
  const { data: historyRows } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('session_id', sessionId!)
    .neq('role', 'system')
    .order('created_at', { ascending: true })
    .limit(HISTORY_LIMIT * 2);
  const history = (historyRows ?? []).slice(-HISTORY_LIMIT) as Array<{ role: 'user' | 'assistant'; content: string }>;

  // ── Build context ────────────────────────────────────────────
  const content = await getSiteContent();
  const francisContext = buildFrancisContext(content);

  let sources: SearchSource[] = [];
  let searchNote: string | null = null;
  const latestUser = [...history].reverse().find((m) => m.role === 'user')?.content ?? message;
  const researchForced = mode === 'research';
  const shouldSearch = ai.web_search && (researchForced || needsLiveInformation(latestUser));
  if (shouldSearch) {
    try {
      const result = await webSearch(latestUser);
      sources = result.sources;
      searchNote = result.provider;
    } catch (err) {
      console.error('[chat] live search failed:', err);
      searchNote = 'search_failed';
    }
  }
  const searchContext = sources.length
    ? sources
        .map((s, i) => `[${i + 1}] ${s.title}\nURL: ${s.url}${s.date ? `\nDate: ${s.date}` : ''}\nSnippet: ${s.snippet}`)
        .join('\n\n')
    : shouldSearch
      ? searchNote === 'search_failed'
        ? 'SEARCH_FAILED: the live search provider could not be reached. Do not fabricate sources; answer with a clear uncertainty note.'
        : 'NO_RESULTS: live search returned no usable results. Do not fabricate sources; answer with a clear uncertainty note.'
      : null;

  let documentContext: string | null = null;
  let documentName: string | null = null;
  if (documentId) {
    const { data: doc } = await supabase
      .from('knowledge_documents')
      .select('name, extracted_text')
      .eq('id', documentId)
      .eq('owner_token', ownerToken)
      .maybeSingle();
    if (doc) {
      documentName = doc.name as string;
      documentContext = `Document: ${doc.name}\n\n${(doc.extracted_text as string).slice(0, DOC_CONTEXT_LIMIT)}`;
    }
  }

  const systemPrompt = buildSystemPrompt({
    ai,
    mode,
    francisContext,
    searchContext,
    documentContext,
    todayISO: new Date().toISOString().slice(0, 10),
  });

  // ── Call the LLM (streaming) ─────────────────────────────────
  let upstream: Response;
  try {
    upstream = await fetch(`${env.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: true,
        stream_options: { include_usage: true },
        max_tokens: ai.max_response_tokens ?? 2048,
        messages: [{ role: 'system', content: systemPrompt }, ...history],
      }),
      signal: req.signal,
    });
  } catch (err) {
    await logUsage(supabase, { ownerToken, sessionId: sessionId!, mode, latencyMs: Date.now() - started, searchUsed: sources.length > 0, error: 'upstream_unreachable' });
    return jsonError(502, 'upstream_unreachable', 'Could not reach the AI provider. Check AI_BASE_URL and network access from the server.');
  }

  if (!upstream.ok || !upstream.body) {
    const detail = (await upstream.text().catch(() => '')).slice(0, 500);
    await logUsage(supabase, { ownerToken, sessionId: sessionId!, mode, latencyMs: Date.now() - started, searchUsed: sources.length > 0, error: `upstream_${upstream.status}` });
    await supabase.from('chat_messages').insert({
      session_id: sessionId!, role: 'assistant', mode,
      content: `⚠️ The AI provider returned an error (HTTP ${upstream.status}). ${humaniseUpstreamError(upstream.status, detail)}`,
    });
    return jsonError(502, 'upstream_error', `The AI provider returned an error (HTTP ${upstream.status}). ${humaniseUpstreamError(upstream.status, detail)}`, { detail: detail || undefined });
  }

  // ── Stream SSE to the client, finalise on completion ─────────
  const encoder = new TextEncoder();
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let tokensIn = 0;
  let tokensOut = 0;
  let buffer = '';
  const finalSessionId = sessionId!;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(sseEvent('meta', { sessionId: finalSessionId, sources, model, mode, searchProvider: searchNote, documentName }));
      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(': ping\n\n')); } catch { /* closed */ }
      }, 15000);
      let stopped = false;
      const clientAborted = () => req.signal.aborted;

      try {
        while (true) {
          if (clientAborted()) { stopped = true; break; }
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const data = trimmed.slice(5).trim();
            if (data === '[DONE]') continue;
            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                fullText += delta;
                controller.enqueue(sseEvent('delta', { text: delta }));
              }
              if (json.usage) {
                tokensIn = json.usage.prompt_tokens ?? tokensIn;
                tokensOut = json.usage.completion_tokens ?? tokensOut;
              }
            } catch {
              // partial JSON chunk — ignore
            }
          }
        }
      } catch (err) {
        console.error('[chat] stream error:', err);
        controller.enqueue(sseEvent('error', { message: 'The connection to the AI provider was interrupted.' }));
      } finally {
        clearInterval(heartbeat);
        try { await reader.cancel(); } catch { /* already closed */ }
        if (!tokensIn) tokensIn = Math.ceil(JSON.stringify(history).length / 4);
        if (!tokensOut) tokensOut = Math.ceil(fullText.length / 4);
        // Persist the assistant reply (full or partial when stopped)
        if (fullText.trim()) {
          await supabase
            .from('chat_messages')
            .insert({ session_id: finalSessionId, role: 'assistant', content: fullText, sources: sources.length ? sources : null, mode });
        }
        await supabase.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', finalSessionId);
        await logUsage(supabase, {
          ownerToken, sessionId: finalSessionId, mode,
          latencyMs: Date.now() - started,
          searchUsed: sources.length > 0,
          tokensIn, tokensOut,
          error: stopped ? 'stopped_by_user' : null,
        });
        controller.enqueue(sseEvent('done', { ok: true, stopped, tokensIn, tokensOut }));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

function humaniseUpstreamError(status: number, detail: string): string {
  if (status === 401) return 'The configured API key was rejected — verify AI_API_KEY on the server.';
  if (status === 403) return 'The provider denied access to this model — check AI_MODEL and account permissions.';
  if (status === 404) return 'The model was not found — check AI_MODEL / AI_BASE_URL.';
  if (status === 429) return 'The provider is rate limiting this key — wait a moment and try again.';
  if (status >= 500) return 'The provider is having trouble — try again shortly.';
  return detail ? `Provider detail: ${detail.slice(0, 200)}` : 'Unknown provider error.';
}

async function logUsage(
  supabase: ReturnType<typeof createServiceClient>,
  entry: {
    ownerToken: string; sessionId: string; mode: string; latencyMs: number;
    searchUsed: boolean; tokensIn?: number; tokensOut?: number; error?: string | null;
  },
) {
  try {
    await supabase.from('ai_usage_logs').insert({
      owner_token: entry.ownerToken,
      session_id: entry.sessionId,
      mode: entry.mode,
      tokens_in: entry.tokensIn ?? 0,
      tokens_out: entry.tokensOut ?? 0,
      latency_ms: entry.latencyMs,
      search_used: entry.searchUsed,
      error: entry.error ?? null,
    });
  } catch (err) {
    console.error('[chat] failed to write usage log:', err);
  }
}
