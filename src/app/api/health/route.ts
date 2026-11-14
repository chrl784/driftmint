import { NextResponse } from 'next/server';
import { isOpenAIConfigured, isStripeConfigured, isSupabaseConfigured } from '@/lib/env';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'driftmint',
    integrations: {
      supabase: isSupabaseConfigured(),
      stripe: isStripeConfigured(),
      openai: isOpenAIConfigured(),
    },
    timestamp: new Date().toISOString(),
  });
}
