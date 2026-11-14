function isConfiguredValue(value: string | undefined, placeholderPrefix: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.includes('your-') || trimmed.startsWith(placeholderPrefix)) return false;
  return true;
}

export function getSupabaseUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return undefined;
  return raw.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
}

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      anon &&
      !url.includes('your-project-id') &&
      !anon.includes('your-supabase') &&
      url.startsWith('https://')
  );
}

export function isSupabaseAdminConfigured(): boolean {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return isSupabaseConfigured() && isConfiguredValue(serviceKey, 'your-');
}

export function isStripeConfigured(): boolean {
  const secret = process.env.STRIPE_SECRET_KEY;
  return Boolean(
    secret &&
      secret.startsWith('sk_') &&
      !secret.includes('your_stripe')
  );
}

export function isOpenAIConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return Boolean(
    key &&
      key.startsWith('sk-') &&
      !key.includes('your-openai')
  );
}

export function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw && (raw.startsWith('http://') || raw.startsWith('https://'))) {
    return raw.replace(/\/$/, '');
  }
  return 'http://localhost:3000';
}
