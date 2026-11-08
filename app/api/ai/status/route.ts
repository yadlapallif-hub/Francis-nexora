import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public AI status — safe metadata only (no secrets, ever). */
export async function GET() {
  const configured = Boolean(process.env.OPENAI_API_KEY);
  const sb = getAdminSupabase();
  if (!sb) {
    return Response.json({ enabled: false, configured, welcome: null, uploads: [] as string[] });
  }
  const { data } = await sb
    .from('ai_settings')
    .select('enabled, welcome_message, allowed_uploads')
    .eq('id', 1)
    .maybeSingle();
  return Response.json(
    {
      enabled: data?.enabled ?? true,
      configured,
      welcome: data?.welcome_message ?? null,
      uploads: data?.allowed_uploads ?? ['pdf', 'txt', 'docx'],
    },
    { headers: { 'cache-control': 'no-store' } }
  );
}
