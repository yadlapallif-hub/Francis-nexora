'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser client for the admin studio. Session persists in cookies/local
 * storage; RLS policies gate every write to allowlisted administrators.
 */
export function getBrowserSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    // Build-time prerender / unconfigured local dev: return an inert client so
    // SSR does not crash. Production (Vercel) always has these set.
    if (typeof window !== 'undefined') {
      console.warn('[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set — studio features are disabled.');
    }
    return createBrowserClient('https://placeholder.supabase.co', 'placeholder-anon-key');
  }
  return createBrowserClient(url, anon);
}
