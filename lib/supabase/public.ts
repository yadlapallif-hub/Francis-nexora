import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Server-side anon client for public content. Never uses cookies or session —
 * safe for static/ISR rendering of public portfolio data. Returns null when
 * the environment is not configured (callers fall back to bundled content).
 */
export function getPublicSupabase(): SupabaseClient | null {
  if (!url || !anon) return null;
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'x-client-info': 'francis-web' } },
  });
}
