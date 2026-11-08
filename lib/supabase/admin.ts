import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://ojzcgeckdrvxvkfphtma.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cached: SupabaseClient | null = null;

/**
 * Privileged service-role client. SERVER ONLY.
 * Used for: contact form inserts, AI session/message persistence, usage logs,
 * private document storage, and public portfolio reads that must not fail.
 * Never imported by client components.
 */
export function createServiceClient(): SupabaseClient {
  if (!SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured on the server.');
  }
  if (!cached) {
    cached = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

export function hasServiceRole(): boolean {
  return Boolean(SERVICE_ROLE_KEY);
}
