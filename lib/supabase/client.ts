import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://ojzcgeckdrvxvkfphtma.supabase.co';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_IK7F0F93SHgLe3eXTX1xyA_eCkED4bV';
  return createBrowserClient(url, anon);
}
