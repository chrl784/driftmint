import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { saveProject } from '@/lib/store';
import { CreateProjectSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const rate = checkRateLimit(`projects:${clientIp}`, 20, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  try {
    const body = (await req.json()) as unknown;
    const parsed = CreateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid project payload' },
        { status: 400 }
      );
    }

    const project = await saveProject(parsed.data);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create project';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
