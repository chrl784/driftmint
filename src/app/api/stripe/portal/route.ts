import { NextResponse } from 'next/server';
import { getAppUrl, isStripeConfigured } from '@/lib/env';
import { getDashboardSnapshot } from '@/lib/store';
import { getStripeClient } from '@/lib/stripe';

export async function POST() {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is running in sandbox mode. Connect STRIPE_SECRET_KEY to manage live billing.' },
        { status: 400 }
      );
    }

    const snapshot = await getDashboardSnapshot();
    const customerId = snapshot.profile.stripeCustomerId;

    if (!customerId) {
      return NextResponse.json(
        { error: 'No active Stripe customer found for this account yet.' },
        { status: 404 }
      );
    }

    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getAppUrl()}/dashboard`,
    });

    return NextResponse.json({ portalUrl: session.url }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to open billing portal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
