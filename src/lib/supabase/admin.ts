import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl } from '@/lib/env';

export function createSupabaseAdminClient() {
  const url = getSupabaseUrl();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey) {
    throw new Error('Supabase admin environment variables are not configured.');
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
