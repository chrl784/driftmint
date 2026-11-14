import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseBrowserClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const url = rawUrl ? rawUrl.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '') : '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error('Supabase browser environment variables are not configured.');
  }

  return createBrowserClient(url, anonKey);
}
