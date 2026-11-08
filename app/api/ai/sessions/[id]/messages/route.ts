import { createServiceClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Fetch all messages of a session owned by the caller. */
export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { searchParams } = new URL(_req.url);
  const ownerToken = searchParams.get('ownerToken')?.trim();
  if (!ownerToken) return Response.json({ error: 'owner_token_required', message: 'ownerToken is required.' }, { status: 400 });

  let supabase;
  try {
    supabase = createServiceClient();
  } catch {
    return Response.json({ error: 'server_not_configured', message: 'Server is missing SUPABASE_SERVICE_ROLE_KEY.' }, { status: 500 });
  }

  const { data: session } = await supabase
    .from('chat_sessions')
    .select('id, owner_token, title, mode')
    .eq('id', id)
    .maybeSingle();
  if (!session || session.owner_token !== ownerToken) {
    return Response.json({ error: 'session_not_found', message: 'Conversation not found.' }, { status: 404 });
  }

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('id, role, content, sources, mode, created_at')
    .eq('session_id', id)
    .order('created_at', { ascending: true })
    .limit(500);

  return Response.json({ session: { id: session.id, title: session.title, mode: session.mode }, messages: messages ?? [] });
}
