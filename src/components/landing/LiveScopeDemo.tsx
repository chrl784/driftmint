'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';
import { formatMoney } from '@/lib/utils';
import type { Currency, ScopeAnalysis } from '@/types/domain';

interface PresetCase {
  id: string;
  label: string;
  projectName: string;
  hourlyRate: number;
  originalSow: string;
  clientMessage: string;
}

const PRESET_CASES: PresetCase[] = [
  {
    id: 'slack-crm',
    label: 'Sneaky CRM + Dark Mode',
    projectName: 'Apex SaaS Marketing Site',
    hourlyRate: 165,
    originalSow:
      'Scope includes 5 marketing pages in Next.js, responsive mobile layout, contact form emailing hello@apex.io, and 2 rounds of copy revisions. Excludes CRM integrations, dark theme variants, and custom dashboards.',
    clientMessage:
      "Hey! Site looks super clean. Quick favor while you're wrapping up — can we also sync the form leads directly into HubSpot CRM with custom tags, and add a sleek Dark Mode toggle across all pages before Friday's launch?",
  },
  {
    id: 'rush-portal',
    label: 'Client Role & PDF Export',
    projectName: 'Kinetix Billing Portal',
    hourlyRate: 185,
    originalSow:
      'Phase 1 delivers single-admin Stripe subscription view, basic usage metrics table, and Vercel deployment. Excludes multi-role RBAC permissions and downloadable PDF invoices.',
    clientMessage:
      "Our finance lead asked if we could add separate Viewer vs Admin permissions and an automated branded PDF invoice download button for every customer row. Shouldn't take too long, right?",
  },
];

export function LiveScopeDemo() {
  const [projectName, setProjectName] = useState(PRESET_CASES[0].projectName);
  const [hourlyRate, setHourlyRate] = useState(PRESET_CASES[0].hourlyRate);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [originalSow, setOriginalSow] = useState(PRESET_CASES[0].originalSow);
  const [clientMessage, setClientMessage] = useState(PRESET_CASES[0].clientMessage);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ScopeAnalysis | null>(null);
  const [activeTone, setActiveTone] = useState<'diplomatic' | 'executive' | 'bundle'>('diplomatic');
  const [mintedUrl, setMintedUrl] = useState<string | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);

  const applyPreset = (preset: PresetCase) => {
    setProjectName(preset.projectName);
    setHourlyRate(preset.hourlyRate);
    setOriginalSow(preset.originalSow);
    setClientMessage(preset.clientMessage);
    setAnalysis(null);
    setMintedUrl(null);
    setErrorMsg(null);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setMintedUrl(null);
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName,
          hourlyRateCents: Math.round(hourlyRate * 100),
          currency,
          originalSow,
          clientMessage,
        }),
      });

      const payload = (await response.json()) as { analysis?: ScopeAnalysis; error?: string };
      if (!response.ok || !payload.analysis) {
        throw new Error(payload.error || 'Could not run scope audit');
      }

      setAnalysis(payload.analysis);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unexpected audit error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMintLink = async () => {
    if (!analysis) return;
    setErrorMsg(null);
    setIsMinting(true);

    try {
      const response = await fetch('/api/change-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId: analysis.id,
          agencyName: 'Northstar Digital Studio',
          projectName: analysis.projectName,
          clientName: 'Alex Rivera (Client)',
          clientEmail: 'client@example.com',
          title: `Add-On: ${analysis.requestedDeliverables[0]?.title ?? 'Scope Expansion'}`,
          summary: analysis.summary,
          deliverables: analysis.requestedDeliverables,
          estimatedHours: analysis.totalEstimatedHours,
          amountCents: Math.max(500, analysis.recommendedAmountCents),
          currency: analysis.currency,
        }),
      });

      const payload = (await response.json()) as {
        approvalUrl?: string;
        changeOrder?: { publicToken: string };
        error?: string;
      };

      if (!response.ok || !payload.changeOrder) {
        throw new Error(payload.error || 'Unable to mint Change Order');
      }

      setMintedUrl(`/approve/${payload.changeOrder.publicToken}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to mint Change Order');
    } finally {
      setIsMinting(false);
    }
  };

  const selectedDraft = analysis?.replyDrafts.find((d) => d.tone === activeTone) ?? analysis?.replyDrafts[0];
  const resolvedDraftBody = selectedDraft
    ? selectedDraft.body.replace(
        '[CHANGE_ORDER_LINK]',
        mintedUrl ? `${typeof window !== 'undefined' ? window.location.origin : ''}${mintedUrl}` : 'https://driftmint.so/approve/demo-link'
      )
    : '';

  const handleCopyDraft = async () => {
    if (!resolvedDraftBody) return;
    await navigator.clipboard.writeText(resolvedDraftBody);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  return (
    <section id="live-auditor" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Interactive Scope Auditor
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Test it on a real client Slack message right now
          </h2>
          <p className="mt-2 max-w-2xl text-base text-slate-600">
            Compare any client ask against your signed SOW, price the hidden hours, and mint a live Stripe approval link in seconds.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESET_CASES.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className="min-h-[44px] cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-blue-300 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              Load: {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <form onSubmit={handleAnalyze} className="glass-panel rounded-2xl p-6 lg:col-span-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label htmlFor="demo-project" className="block text-xs font-bold uppercase tracking-wide text-slate-700">
                Project Name
              </label>
              <input
                id="demo-project"
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label htmlFor="demo-rate" className="block text-xs font-bold uppercase tracking-wide text-slate-700">
                Hourly Rate
              </label>
              <input
                id="demo-rate"
                type="number"
                min={25}
                max={2000}
                required
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value) || 150)}
                className="mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label htmlFor="demo-currency" className="block text-xs font-bold uppercase tracking-wide text-slate-700">
                Currency
              </label>
              <select
                id="demo-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="demo-sow" className="block text-xs font-bold uppercase tracking-wide text-slate-700">
              Original Signed SOW (Scope Baseline)
            </label>
            <textarea
              id="demo-sow"
              rows={3}
              required
              value={originalSow}
              onChange={(e) => setOriginalSow(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm leading-relaxed text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="demo-msg" className="block text-xs font-bold uppercase tracking-wide text-slate-700">
              Incoming Client Slack / Email Message
            </label>
            <textarea
              id="demo-msg"
              rows={4}
              required
              value={clientMessage}
              onChange={(e) => setClientMessage(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm leading-relaxed text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          {errorMsg && (
            <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isAnalyzing}
            className="mt-5 flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                Auditing SOW & Pricing Drift...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" aria-hidden="true" />
                Detect Scope Drift & Price Add-On
              </>
            )}
          </button>
        </form>

        <div className="glass-panel flex flex-col justify-between rounded-2xl p-6 lg:col-span-6">
          {!analysis ? (
            <div className="flex h-full min-h-[340px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
              <ShieldAlert className="h-10 w-10 text-blue-600" aria-hidden="true" />
              <h3 className="mt-3 text-lg font-bold text-slate-900">
                Your Scope-Drift Verdict Appears Here
              </h3>
              <p className="mt-1.5 max-w-md text-sm text-slate-600">
                Click <strong>Detect Scope Drift & Price Add-On</strong> to extract exact out-of-scope hours, recommended Change-Order pricing, and 3 diplomatic client replies.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase text-amber-900">
                    Drift Score: {analysis.driftScore}/100 ({analysis.severity})
                  </span>
                  <p className="mt-2 text-sm font-medium text-slate-700">{analysis.summary}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-right">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    Recoverable Add-On
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-700">
                    {formatMoney(analysis.recommendedAmountCents, analysis.currency)}
                  </span>
                  <span className="block text-xs font-semibold text-emerald-800">
                    {analysis.totalEstimatedHours} billable hrs
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Itemized Out-of-Scope Deliverables
                </h4>
                <ul className="mt-2 space-y-2">
                  {analysis.requestedDeliverables.map((item, idx) => (
                    <li
                      key={`${item.title}-${idx}`}
                      className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-600">{item.rationale}</p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800">
                        {item.estimatedHours}h
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Ready-to-Send Client Reply
                  </h4>
                  <div className="flex gap-1.5">
                    {analysis.replyDrafts.map((draft) => (
                      <button
                        key={draft.tone}
                        type="button"
                        onClick={() => setActiveTone(draft.tone)}
                        className={`min-h-[36px] cursor-pointer rounded-lg px-2.5 text-xs font-bold capitalize transition ${
                          activeTone === draft.tone
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {draft.tone}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-800 whitespace-pre-line">
                  {resolvedDraftBody}
                </div>

                <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleCopyDraft}
                    className="inline-flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                  >
                    {copiedDraft ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                        Copied Reply
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" aria-hidden="true" />
                        Copy Message
                      </>
                    )}
                  </button>

                  {!mintedUrl ? (
                    <button
                      type="button"
                      disabled={isMinting}
                      onClick={handleMintLink}
                      className="inline-flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-orange-800 disabled:opacity-60"
                    >
                      {isMinting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          Minting Link...
                        </>
                      ) : (
                        <>
                          Mint Stripe Change-Order Link
                        </>
                      )}
                    </button>
                  ) : (
                    <Link
                      href={mintedUrl}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
                    >
                      Open Client Approval Portal
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
