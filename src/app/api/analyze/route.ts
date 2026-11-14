import { NextRequest, NextResponse } from 'next/server';
import { analyzeScopeDrift } from '@/lib/ai/scope-analyzer';
import { checkRateLimit } from '@/lib/rate-limit';
import { saveScopeAnalysis } from '@/lib/store';
import { AnalyzeScopeRequestSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const rate = checkRateLimit(`analyze:${clientIp}`, 15, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded for AI scope audits.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  try {
    const body = (await req.json()) as unknown;
    const parsed = AnalyzeScopeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid audit request' },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const result = await analyzeScopeDrift({
      projectName: data.projectName,
      originalSow: data.originalSow,
      clientMessage: data.clientMessage,
      hourlyRateCents: data.hourlyRateCents,
      currency: data.currency,
    });

    const saved = await saveScopeAnalysis({
      projectId: data.projectId ?? null,
      projectName: data.projectName,
      clientMessage: data.clientMessage,
      originalSow: data.originalSow,
      isOutOfScope: result.isOutOfScope,
      driftScore: result.driftScore,
      severity: result.severity,
      summary: result.summary,
      violatedClauses: result.violatedClauses,
      requestedDeliverables: result.requestedDeliverables,
      totalEstimatedHours: result.totalEstimatedHours,
      recommendedAmountCents: result.recommendedAmountCents,
      currency: data.currency,
      replyDrafts: result.replyDrafts,
      engineSource: result.engineSource,
    });

    return NextResponse.json({ analysis: saved }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to analyze scope drift';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
