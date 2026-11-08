import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cached: SupabaseClient | null = null;

/**
 * Service-role client — SERVER ONLY. Bypasses RLS, used inside API routes for
 * contact intake, AI persistence, analytics and rate limiting. Never import
 * this from a client component.
 */
export function getAdminSupabase(): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  if (!cached) {
    cached = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { 'x-client-info': 'francis-server' } },
    });
  }
  return cached;
}
