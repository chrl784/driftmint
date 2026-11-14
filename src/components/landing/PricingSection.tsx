'use client';

import React, { useState } from 'react';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import type { PlanTier } from '@/types/domain';

interface PlanCardData {
  tier: Exclude<PlanTier, 'free'>;
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  ctaLabel: string;
}

const PLANS: PlanCardData[] = [
  {
    tier: 'starter',
    name: 'Solo Freelancer',
    price: '$39',
    cadence: '/month',
    description: 'For independent developers, designers & consultants protecting every billable hour.',
    features: [
      'Up to 30 AI Scope-Drift Audits / month',
      'Unlimited branded Change-Order links',
      '3 diplomatic response templates per audit',
      'Instant Stripe checkout & e-signature capture',
    ],
    ctaLabel: 'Start Freelancer Plan',
  },
  {
    tier: 'studio',
    name: 'Agency Studio',
    price: '$99',
    cadence: '/month',
    description: 'Built for agencies turning daily client Slack requests into high-margin add-ons.',
    features: [
      'Unlimited AI Scope-Drift Audits & SOW baselines',
      'Multi-currency Change Orders (USD, EUR, GBP, CAD)',
      'Custom project hourly rate & margin engine',
      'Real-time recovery analytics & webhook sync',
    ],
    highlighted: true,
    ctaLabel: 'Launch Agency Studio',
  },
  {
    tier: 'founding_lifetime',
    name: 'Founding Lifetime',
    price: '$299',
    cadence: 'one-time',
    description: 'First 50 agencies lock in full Studio access forever with zero monthly fees.',
    features: [
      'Everything in Agency Studio forever',
      'Zero recurring subscription costs',
      'Pays for itself on your first 2-hour Change Order',
      'Priority roadmap & SOW clause library',
    ],
    ctaLabel: 'Claim Founding Lifetime',
  },
];

export function PricingSection() {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (tier: Exclude<PlanTier, 'free'>) => {
    setError(null);
    setLoadingTier(tier);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: tier }),
      });

      const payload = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (!response.ok || !payload.checkoutUrl) {
        throw new Error(payload.error || 'Could not start checkout');
      }

      window.location.href = payload.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout error');
      setLoadingTier(null);
    }
  };

  return (
    <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Day-1 ROI Pricing
        </span>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          One caught &ldquo;quick favor&rdquo; pays for an entire year
        </h2>
        <p className="mt-3 text-base text-slate-600">
          Agencies recover an average of $2,400/month in previously unbilled scope creep within their first 14 days.
        </p>
      </div>

      {error && (
        <div role="alert" className="mx-auto mt-6 max-w-md rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.tier}
            className={`relative flex flex-col justify-between rounded-2xl p-7 transition ${
              plan.highlighted
                ? 'border-2 border-blue-600 bg-white shadow-xl shadow-blue-600/10'
                : 'glass-panel'
            }`}
          >
            {plan.highlighted && (
              <span className="absolute -top-3.5 right-6 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
                Most Popular
              </span>
            )}

            <div>
              <h3 className="text-lg font-extrabold text-slate-900">{plan.name}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{plan.description}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                  {plan.price}
                </span>
                <span className="text-sm font-semibold text-slate-600">{plan.cadence}</span>
              </div>

              <ul className="mt-6 space-y-3 border-t border-slate-200 pt-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              disabled={loadingTier !== null}
              onClick={() => handleCheckout(plan.tier)}
              className={`mt-8 flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-60 ${
                plan.highlighted
                  ? 'bg-orange-700 text-white hover:bg-orange-800'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {loadingTier === plan.tier ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Connecting Stripe...
                </>
              ) : (
                plan.ctaLabel
              )}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
