import { NextRequest } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TOKEN_RE = /^[A-Za-z0-9_-]{8,80}$/;

/** List the caller's conversation sessions (metadata only). */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const owner = String(body.owner ?? '');
  if (!TOKEN_RE.test(owner)) {
    return Response.json({ code: 'bad_owner_token', message: 'Invalid owner token.' }, { status: 400 });
  }
  const sb = getAdminSupabase();
  if (!sb) return Response.json({ sessions: [] });
  const { data, error } = await sb
    .from('chat_sessions')
    .select('id, title, mode, created_at, updated_at')
    .eq('owner_token', owner)
    .order('updated_at', { ascending: false })
    .limit(100);
  if (error) return Response.json({ code: 'db_error', message: error.message }, { status: 500 });
  return Response.json({ sessions: data ?? [] });
}
