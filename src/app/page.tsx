import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Clock,
  CreditCard,
  FileCheck2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Navbar } from '@/components/ui/Navbar';
import { MarginPrismCanvas } from '@/components/three/MarginPrismCanvas';
import { LiveScopeDemo } from '@/components/landing/LiveScopeDemo';
import { PricingSection } from '@/components/landing/PricingSection';
import { LogoMark } from '@/components/ui/LogoMark';

const WORKFLOW_STEPS = [
  {
    icon: Sparkles,
    title: '1. Paste Any Client Slack or Email',
    description:
      'Drop in the "quick favor" message alongside your original SOW. DriftMint flags every out-of-scope requirement and estimates engineering/design hours automatically.',
  },
  {
    icon: FileCheck2,
    title: '2. Copy a Diplomatic Boundary Reply',
    description:
      'Choose Soft, Executive, or Value-Bundle framing. No awkward confrontation — your client sees clear options and a 1-click Change-Order link.',
  },
  {
    icon: CreditCard,
    title: '3. Client Signs & Pays via Stripe',
    description:
      'Your client reviews the line items on a crisp mobile portal, types their signature, and settles the invoice via Stripe Checkout before you write a single line of extra code.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white via-blue-50/30 to-[#F8FAFC] pt-12 pb-16 sm:pt-16 sm:pb-24">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-800">
                <ShieldCheck className="h-4 w-4 text-blue-600" aria-hidden="true" />
                Stop doing $1,500+ of free &ldquo;quick favors&rdquo; every month
              </div>

              <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl lg:leading-[1.08]">
                Turn Client Scope Creep Into{' '}
                <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  Paid Change Orders
                </span>{' '}
                in 15 Seconds
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
                DriftMint compares client Slack & email requests against your signed SOW, calculates fair add-on pricing, writes diplomatic replies, and embeds an instant Stripe e-sign checkout link.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href="#live-auditor"
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-orange-700 px-6 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2"
                >
                  Run Free Scope Audit Now
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </a>

                <Link
                  href="/dashboard"
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-bold text-slate-800 shadow-xs transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  Open Agency Workspace
                </Link>
              </div>

              <div className="mt-8 grid max-w-lg grid-cols-3 gap-4 border-t border-slate-200 pt-6">
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">15 sec</p>
                  <p className="text-xs font-medium text-slate-600">Draft to payment link</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-emerald-700">89%</p>
                  <p className="text-xs font-medium text-slate-600">Client approval rate</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">$2.4k</p>
                  <p className="text-xs font-medium text-slate-600">Avg. monthly recovery</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="glass-panel rounded-3xl p-4 sm:p-5">
                <MarginPrismCanvas />
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <Clock className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                      Saved This Week
                    </span>
                    <p className="mt-1 text-xl font-extrabold text-slate-900">15.5 hrs</p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                    <span className="text-xs font-semibold text-emerald-800">
                      Change Orders Paid
                    </span>
                    <p className="mt-1 text-xl font-extrabold text-emerald-700">$2,747</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Interactive Scope Auditor */}
        <LiveScopeDemo />

        {/* Workflow Steps */}
        <section id="how-it-works" className="border-y border-slate-200/80 bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Zero awkward money talks. Pure margin protection.
              </h2>
              <p className="mt-3 text-base text-slate-600">
                Built so account managers, solo devs, and agency founders enforce boundaries without slowing delivery.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {WORKFLOW_STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 transition hover:border-blue-200 hover:bg-white hover:shadow-md"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="mt-5 text-lg font-extrabold text-slate-900">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <PricingSection />
      </main>

      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-7" />
            <span className="text-sm font-extrabold text-slate-900">DriftMint</span>
            <span className="text-xs text-slate-500">· driftmint.so</span>
          </div>
          <p className="text-xs text-slate-500">
            Automated Scope-Drift Detection & Instant Change-Order Checkout for Agencies.
          </p>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <Link href="/dashboard" className="hover:text-slate-900">
              Dashboard
            </Link>
            <Link href="/approve/kinetix-pdf-export" className="hover:text-slate-900">
              Sample Client Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
