import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { isStripeConfigured } from '@/lib/env';
import {
  recordStripeEventIfNew,
  updateAgencySubscription,
  updateChangeOrderByToken,
} from '@/lib/store';
import { getStripeClient } from '@/lib/stripe';
import type { PlanTier } from '@/types/domain';

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get('stripe-signature');

  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: 'Missing Stripe webhook signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  const rawBody = await req.text();

  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid webhook signature';
    return NextResponse.json({ error: `Webhook verification failed: ${message}` }, { status: 400 });
  }

  try {
    const isNew = await recordStripeEventIfNew(event.id, event.type);
    if (!isNew) {
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata ?? {};

        if (metadata.type === 'change_order' && metadata.public_token) {
          await updateChangeOrderByToken(metadata.public_token, {
            status: 'paid',
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId:
              typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
            paidAt: new Date().toISOString(),
          });
        } else if (metadata.type === 'saas_plan') {
          const planTier = (metadata.plan_tier as PlanTier) || 'starter';
          await updateAgencySubscription({
            userId: metadata.user_id,
            stripeCustomerId:
              typeof session.customer === 'string' ? session.customer : undefined,
            stripeSubscriptionId:
              typeof session.subscription === 'string' ? session.subscription : null,
            planTier,
            subscriptionStatus:
              planTier === 'founding_lifetime' ? 'lifetime' : 'active',
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string' ? subscription.customer : undefined;
        const mappedStatus =
          subscription.status === 'active' || subscription.status === 'trialing'
            ? 'active'
            : subscription.status === 'past_due'
              ? 'past_due'
              : 'canceled';

        if (customerId) {
          await updateAgencySubscription({
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: mappedStatus,
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string' ? subscription.customer : undefined;
        if (customerId) {
          await updateAgencySubscription({
            stripeCustomerId: customerId,
            stripeSubscriptionId: null,
            planTier: 'free',
            subscriptionStatus: 'canceled',
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === 'string' ? invoice.customer : undefined;
        if (customerId) {
          await updateAgencySubscription({
            stripeCustomerId: customerId,
            subscriptionStatus: 'past_due',
          });
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook handler failure';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
