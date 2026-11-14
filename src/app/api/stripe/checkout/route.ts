import { NextRequest, NextResponse } from 'next/server';
import { getAppUrl, isStripeConfigured } from '@/lib/env';
import { getDashboardSnapshot, updateAgencySubscription } from '@/lib/store';
import { getStripeClient, PLAN_CATALOG } from '@/lib/stripe';
import { CheckoutPlanSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    const parsed = CheckoutPlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please select a valid DriftMint plan.' },
        { status: 400 }
      );
    }

    const plan = PLAN_CATALOG[parsed.data.plan];
    const snapshot = await getDashboardSnapshot();
    const appUrl = getAppUrl();

    if (!isStripeConfigured()) {
      await updateAgencySubscription({
        userId: snapshot.profile.id,
        planTier: plan.tier,
        subscriptionStatus: plan.tier === 'founding_lifetime' ? 'lifetime' : 'active',
      });
      return NextResponse.json({
        checkoutUrl: `${appUrl}/dashboard?upgrade=sandbox_success&plan=${plan.tier}`,
        sandboxUpgraded: true,
      });
    }

    const stripe = getStripeClient();
    const hasCustomPrice =
      plan.envPriceId && !plan.envPriceId.startsWith('price_starter') && !plan.envPriceId.startsWith('price_studio') && !plan.envPriceId.startsWith('price_founding');

    const lineItem = hasCustomPrice
      ? { price: plan.envPriceId!, quantity: 1 }
      : {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: plan.fallbackUnitAmountCents,
            product_data: {
              name: `DriftMint — ${plan.name}`,
              description: plan.description,
            },
            ...(plan.billingMode === 'subscription'
              ? { recurring: { interval: 'month' as const } }
              : {}),
          },
        };

    const session = await stripe.checkout.sessions.create({
      mode: plan.billingMode,
      customer: snapshot.profile.stripeCustomerId || undefined,
      customer_email: snapshot.profile.stripeCustomerId
        ? undefined
        : snapshot.profile.email || undefined,
      line_items: [lineItem],
      metadata: {
        type: 'saas_plan',
        user_id: snapshot.profile.id,
        plan_tier: plan.tier,
      },
      success_url: `${appUrl}/dashboard?upgrade=success&plan=${plan.tier}`,
      cancel_url: `${appUrl}/dashboard?upgrade=cancelled`,
    });

    return NextResponse.json({ checkoutUrl: session.url, sandboxUpgraded: false }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to start Stripe checkout';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
