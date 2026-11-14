import { NextRequest, NextResponse } from 'next/server';
import { getAppUrl, isStripeConfigured } from '@/lib/env';
import { checkRateLimit } from '@/lib/rate-limit';
import { getChangeOrderByToken, updateChangeOrderByToken } from '@/lib/store';
import { getStripeClient } from '@/lib/stripe';
import { ApproveChangeOrderSchema } from '@/lib/validation';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const rate = checkRateLimit(`approve:${token}:${clientIp}`, 12, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  try {
    const existing = await getChangeOrderByToken(token);
    if (!existing) {
      return NextResponse.json({ error: 'Change Order not found' }, { status: 404 });
    }

    if (existing.status === 'paid') {
      return NextResponse.json(
        { error: 'This Change Order has already been approved and paid.' },
        { status: 409 }
      );
    }

    const body = (await req.json()) as unknown;
    const parsed = ApproveChangeOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid approval payload' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    if (parsed.data.action === 'decline') {
      const declined = await updateChangeOrderByToken(token, {
        status: 'declined',
        clientSignatureName: parsed.data.signatureName,
        clientSignatureIp: clientIp,
      });
      return NextResponse.json({ changeOrder: declined, checkoutUrl: null }, { status: 200 });
    }

    if (!isStripeConfigured()) {
      const settled = await updateChangeOrderByToken(token, {
        status: 'paid',
        clientSignatureName: parsed.data.signatureName,
        clientSignatureIp: clientIp,
        approvedAt: now,
        paidAt: now,
      });
      return NextResponse.json(
        {
          changeOrder: settled,
          checkoutUrl: null,
          sandboxSettled: true,
        },
        { status: 200 }
      );
    }

    const stripe = getStripeClient();
    const appUrl = getAppUrl();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: existing.clientEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: existing.currency.toLowerCase(),
            unit_amount: existing.amountCents,
            product_data: {
              name: existing.title,
              description: `${existing.agencyName} — ${existing.projectName} (${existing.estimatedHours}h Change Order)`,
            },
          },
        },
      ],
      metadata: {
        type: 'change_order',
        change_order_id: existing.id,
        public_token: existing.publicToken,
      },
      success_url: `${appUrl}/approve/${existing.publicToken}?payment=success`,
      cancel_url: `${appUrl}/approve/${existing.publicToken}?payment=cancelled`,
    });

    const updated = await updateChangeOrderByToken(token, {
      status: 'approved',
      clientSignatureName: parsed.data.signatureName,
      clientSignatureIp: clientIp,
      approvedAt: now,
      stripeCheckoutSessionId: session.id,
    });

    return NextResponse.json(
      {
        changeOrder: updated,
        checkoutUrl: session.url,
        sandboxSettled: false,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to process Change Order';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
