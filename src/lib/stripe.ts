import Stripe from 'stripe';
import type { PlanTier } from '@/types/domain';
import { isStripeConfigured } from './env';

let stripeInstance: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured in environment variables.');
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    });
  }
  return stripeInstance;
}

export interface PlanDefinition {
  tier: Exclude<PlanTier, 'free'>;
  name: string;
  priceLabel: string;
  billingMode: 'subscription' | 'payment';
  envPriceId: string | undefined;
  fallbackUnitAmountCents: number;
  intervalLabel: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

export const PLAN_CATALOG: Record<Exclude<PlanTier, 'free'>, PlanDefinition> = {
  starter: {
    tier: 'starter',
    name: 'Solo Freelancer',
    priceLabel: '$39',
    billingMode: 'subscription',
    envPriceId: process.env.STRIPE_PRICE_STARTER_MONTHLY,
    fallbackUnitAmountCents: 3900,
    intervalLabel: '/month',
    description: 'For independent consultants & developers protecting every billable hour.',
    features: [
      'Up to 30 AI Scope-Drift Audits / month',
      'Unlimited branded Change-Order payment links',
      '3 diplomatic response templates per audit',
      'Instant Stripe checkout & e-signature capture',
    ],
  },
  studio: {
    tier: 'studio',
    name: 'Agency Studio',
    priceLabel: '$99',
    billingMode: 'subscription',
    envPriceId: process.env.STRIPE_PRICE_STUDIO_MONTHLY,
    fallbackUnitAmountCents: 9900,
    intervalLabel: '/month',
    description: 'Built for digital agencies turning daily Slack requests into high-margin add-ons.',
    features: [
      'Unlimited AI Scope-Drift Audits & SOW baselines',
      'Multi-currency Change Orders (USD, EUR, GBP, CAD)',
      'Custom margin & hourly rate multipliers',
      'Priority webhook sync & audit export',
    ],
    highlighted: true,
  },
  founding_lifetime: {
    tier: 'founding_lifetime',
    name: 'Founding Lifetime',
    priceLabel: '$299',
    billingMode: 'payment',
    envPriceId: process.env.STRIPE_PRICE_FOUNDING_LIFETIME,
    fallbackUnitAmountCents: 29900,
    intervalLabel: 'one-time',
    description: 'First 50 agencies lock in Studio access forever with zero recurring fees.',
    features: [
      'Everything in Agency Studio forever',
      'Zero monthly subscription fees',
      'Direct founder onboarding & SOW template pack',
      'Pays for itself on your first 2-hour Change Order',
    ],
  },
};
