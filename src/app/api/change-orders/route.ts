import { NextRequest, NextResponse } from 'next/server';
import { getAppUrl } from '@/lib/env';
import { checkRateLimit } from '@/lib/rate-limit';
import { createChangeOrder } from '@/lib/store';
import { CreateChangeOrderSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const rate = checkRateLimit(`change-orders:${clientIp}`, 20, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many Change Orders created. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  try {
    const body = (await req.json()) as unknown;
    const parsed = CreateChangeOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid Change Order fields' },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const order = await createChangeOrder({
      projectId: d.projectId ?? null,
      analysisId: d.analysisId ?? null,
      agencyName: d.agencyName,
      projectName: d.projectName,
      clientName: d.clientName,
      clientEmail: d.clientEmail,
      title: d.title,
      summary: d.summary,
      deliverables: d.deliverables,
      estimatedHours: d.estimatedHours,
      amountCents: d.amountCents,
      currency: d.currency,
    });

    const approvalUrl = `${getAppUrl()}/approve/${order.publicToken}`;
    return NextResponse.json({ changeOrder: order, approvalUrl }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create Change Order';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
