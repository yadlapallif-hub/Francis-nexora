import { createServiceClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function bad(status: number, code: string, message: string) {
  return Response.json({ error: code, message }, { status });
}

function getClient() {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

/** List sessions for an owner token (most recent first). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ownerToken = searchParams.get('ownerToken')?.trim();
  if (!ownerToken) return bad(400, 'owner_token_required', 'ownerToken is required.');
  const supabase = getClient();
  if (!supabase) return bad(500, 'server_not_configured', 'Server is missing SUPABASE_SERVICE_ROLE_KEY.');

  const { data: sessions, error } = await supabase
    .from('chat_sessions')
    .select('id, title, mode, created_at, updated_at')
    .eq('owner_token', ownerToken)
    .order('updated_at', { ascending: false })
    .limit(60);
  if (error) return bad(500, 'query_failed', 'Could not load conversations.');

  const ids = (sessions ?? []).map((s) => s.id as string);
  let counts = new Map<string, number>();
  if (ids.length) {
    const { data: msgs } = await supabase.from('chat_messages').select('session_id').in('session_id', ids);
    for (const m of msgs ?? []) counts.set(m.session_id as string, (counts.get(m.session_id as string) ?? 0) + 1);
  }
  return Response.json({
    sessions: (sessions ?? []).map((s) => ({ ...s, message_count: counts.get(s.id as string) ?? 0 })),
  });
}

/** Rename a session. */
export async function PATCH(req: Request) {
  const body = (await req.json().catch(() => null)) as { ownerToken?: string; sessionId?: string; title?: string } | null;
  const ownerToken = body?.ownerToken?.trim();
  const sessionId = body?.sessionId?.trim();
  const title = body?.title?.trim().slice(0, 80);
  if (!ownerToken || !sessionId || !title) return bad(400, 'bad_request', 'ownerToken, sessionId and a non-empty title are required.');
  const supabase = getClient();
  if (!supabase) return bad(500, 'server_not_configured', 'Server is missing SUPABASE_SERVICE_ROLE_KEY.');

  const { data, error } = await supabase
    .from('chat_sessions')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('owner_token', ownerToken)
    .select('id')
    .maybeSingle();
  if (error || !data) return bad(404, 'session_not_found', 'Conversation not found.');
  return Response.json({ ok: true });
}

/** Delete a session (messages cascade). */
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const ownerToken = searchParams.get('ownerToken')?.trim();
  const sessionId = searchParams.get('sessionId')?.trim();
  if (!ownerToken || !sessionId) return bad(400, 'bad_request', 'ownerToken and sessionId are required.');
  const supabase = getClient();
  if (!supabase) return bad(500, 'server_not_configured', 'Server is missing SUPABASE_SERVICE_ROLE_KEY.');

  const { error } = await supabase.from('chat_sessions').delete().eq('id', sessionId).eq('owner_token', ownerToken);
  if (error) return bad(500, 'delete_failed', 'Could not delete the conversation.');
  return Response.json({ ok: true });
}
