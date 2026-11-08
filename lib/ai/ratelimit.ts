import 'server-only';
import { getAdminSupabase } from '@/lib/supabase/admin';

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Per-owner sliding hourly rate limit, backed by ai_usage_logs.
 * Fails open (logged) when the database is unreachable so the AI can
 * still serve; abuse is additionally capped by provider-side quotas.
 */
export async function checkHourlyLimit(ownerToken: string, limit: number): Promise<RateLimitResult> {
  const sb = getAdminSupabase();
  if (!sb) return { ok: true, limit, remaining: limit, retryAfterSeconds: 0 };

  try {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error } = await sb
      .from('ai_usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('owner_token', ownerToken)
      .gte('created_at', since);

    if (error) throw error;
    const used = count ?? 0;
    const remaining = Math.max(0, limit - used);
    return {
      ok: used < limit,
      limit,
      remaining,
      retryAfterSeconds: used < limit ? 0 : 3600,
    };
  } catch (error) {
    console.error('[ratelimit] check failed, allowing request:', error);
    return { ok: true, limit, remaining: limit, retryAfterSeconds: 0 };
  }
}

export async function logUsage(entry: {
  ownerToken: string;
  sessionId: string | null;
  mode: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  searchUsed: boolean;
  error?: string | null;
}) {
  const sb = getAdminSupabase();
  if (!sb) return;
  try {
    await sb.from('ai_usage_logs').insert({
      owner_token: entry.ownerToken,
      session_id: entry.sessionId,
      mode: entry.mode,
      tokens_in: entry.tokensIn,
      tokens_out: entry.tokensOut,
      latency_ms: entry.latencyMs,
      search_used: entry.searchUsed,
      error: entry.error ?? null,
    });
  } catch (error) {
    console.error('[ratelimit] failed to log usage:', error);
  }
}
