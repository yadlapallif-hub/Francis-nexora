import { createServerSupabase } from '@/lib/supabase/server';
import { getAiEnv } from '@/lib/ai/config';
import { hasServiceRole } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Admin-only: environment health booleans for the AI Configuration panel. Never exposes secret values. */
export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'not_authenticated', message: 'Sign in to the admin studio first.' }, { status: 401 });
  const { data: isAdmin, error } = await supabase.rpc('is_admin');
  if (error || !isAdmin) {
    return Response.json({ error: 'not_admin', message: 'This account is not on the admin allowlist.' }, { status: 403 });
  }
  const env = getAiEnv();
  return Response.json({
    aiKeyPresent: Boolean(env.apiKey),
    baseUrl: env.baseUrl,
    modelOverride: env.modelOverride,
    providerLabel: env.providerLabel,
    serviceRolePresent: hasServiceRole(),
    searchConfigured: Boolean(env.searchKey),
    searchProvider: env.searchKey ? 'Serper.dev' : 'DuckDuckGo (built-in web search)',
  });
}
