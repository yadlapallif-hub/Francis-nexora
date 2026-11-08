import { createServiceClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Clear all messages in a session, keeping the session itself. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { ownerToken?: string; sessionId?: string } | null;
  const ownerToken = body?.ownerToken?.trim();
  const sessionId = body?.sessionId?.trim();
  if (!ownerToken || !sessionId) {
    return Response.json({ error: 'bad_request', message: 'ownerToken and sessionId are required.' }, { status: 400 });
  }
  let supabase;
  try {
    supabase = createServiceClient();
  } catch {
    return Response.json({ error: 'server_not_configured', message: 'Server is missing SUPABASE_SERVICE_ROLE_KEY.' }, { status: 500 });
  }
  const { data: session } = await supabase.from('chat_sessions').select('id').eq('id', sessionId).eq('owner_token', ownerToken).maybeSingle();
  if (!session) return Response.json({ error: 'session_not_found', message: 'Conversation not found.' }, { status: 404 });

  await supabase.from('chat_messages').delete().eq('session_id', sessionId);
  return Response.json({ ok: true });
}
