import { NextRequest } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TOKEN_RE = /^[A-Za-z0-9_-]{8,80}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function valid(owner: string, id: string) {
  return TOKEN_RE.test(owner) && UUID_RE.test(id);
}

async function ownedSession(sb: NonNullable<ReturnType<typeof getAdminSupabase>>, id: string, owner: string) {
  const { data } = await sb.from('chat_sessions').select('id, owner_token').eq('id', id).maybeSingle();
  return data && data.owner_token === owner ? data : null;
}

type Ctx = { params: Promise<{ id: string }> };

/** Fetch messages of one of my sessions. */
export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const owner = req.nextUrl.searchParams.get('owner') ?? '';
  if (!valid(owner, id)) return Response.json({ code: 'bad_request', message: 'Invalid request.' }, { status: 400 });
  const sb = getAdminSupabase();
  if (!sb) return Response.json({ messages: [] });
  const session = await ownedSession(sb, id, owner);
  if (!session) return Response.json({ code: 'not_found', message: 'Conversation not found.' }, { status: 404 });
  const { data, error } = await sb
    .from('chat_messages')
    .select('id, role, content, sources, mode, created_at')
    .eq('session_id', id)
    .order('created_at', { ascending: true })
    .limit(500);
  if (error) return Response.json({ code: 'db_error', message: error.message }, { status: 500 });
  return Response.json({ messages: data ?? [] });
}

/** Rename a session (title only). */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const owner = String(body.owner ?? '');
  const title = String(body.title ?? '').trim().slice(0, 120);
  if (!valid(owner, id) || !title) {
    return Response.json({ code: 'bad_request', message: 'A non-empty title is required.' }, { status: 400 });
  }
  const sb = getAdminSupabase();
  if (!sb) return Response.json({ code: 'db_unavailable', message: 'Database unavailable.' }, { status: 503 });
  const session = await ownedSession(sb, id, owner);
  if (!session) return Response.json({ code: 'not_found', message: 'Conversation not found.' }, { status: 404 });
  const { error } = await sb.from('chat_sessions').update({ title }).eq('id', id);
  if (error) return Response.json({ code: 'db_error', message: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

/** Delete a session and all its messages (cascade). */
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const owner = req.nextUrl.searchParams.get('owner') ?? '';
  if (!valid(owner, id)) return Response.json({ code: 'bad_request', message: 'Invalid request.' }, { status: 400 });
  const sb = getAdminSupabase();
  if (!sb) return Response.json({ code: 'db_unavailable', message: 'Database unavailable.' }, { status: 503 });
  const session = await ownedSession(sb, id, owner);
  if (!session) return Response.json({ code: 'not_found', message: 'Conversation not found.' }, { status: 404 });
  const { error } = await sb.from('chat_sessions').delete().eq('id', id);
  if (error) return Response.json({ code: 'db_error', message: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
