'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  DollarSign,
  ExternalLink,
  FolderPlus,
  Loader2,
  LogOut,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { formatMoney, formatShortDate } from '@/lib/utils';
import { LogoMark } from '@/components/ui/LogoMark';
import type {
  Currency,
  DashboardSnapshot,
  Project,
  ScopeAnalysis,
} from '@/types/domain';

interface DashboardClientProps {
  initialSnapshot: DashboardSnapshot;
}

export function DashboardClient({ initialSnapshot }: DashboardClientProps) {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(initialSnapshot);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialSnapshot.projects[0]?.id ?? ''
  );

  const selectedProject: Project | undefined = snapshot.projects.find(
    (p) => p.id === selectedProjectId
  );

  // Audit Form State
  const [projectName, setProjectName] = useState(
    selectedProject?.name ?? 'Custom Client Project'
  );
  const [clientName, setClientName] = useState(
    selectedProject?.clientName ?? 'Alex Rivera'
  );
  const [clientEmail, setClientEmail] = useState(
    selectedProject?.clientEmail ?? 'client@example.com'
  );
  const [hourlyRate, setHourlyRate] = useState(
    selectedProject ? selectedProject.hourlyRateCents / 100 : 165
  );
  const [currency, setCurrency] = useState<Currency>(
    selectedProject?.currency ?? 'USD'
  );
  const [originalSow, setOriginalSow] = useState(
    selectedProject?.originalSow ?? ''
  );
  const [clientMessage, setClientMessage] = useState('');

  const [latestAnalysis, setLatestAnalysis] = useState<ScopeAnalysis | null>(
    initialSnapshot.analyses[0] ?? null
  );
  const [isAuditing, setIsAuditing] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Project Drawer State
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newRate, setNewRate] = useState(165);
  const [newCurrency, setNewCurrency] = useState<Currency>('USD');
  const [newSow, setNewSow] = useState('');
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);

  const refreshSnapshot = async () => {
    const res = await fetch('/api/dashboard', { cache: 'no-store' });
    if (res.ok) {
      const updated = (await res.json()) as DashboardSnapshot;
      setSnapshot(updated);
    }
  };

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    const found = snapshot.projects.find((p) => p.id === id);
    if (found) {
      setProjectName(found.name);
      setClientName(found.clientName);
      setClientEmail(found.clientEmail);
      setHourlyRate(found.hourlyRateCents / 100);
      setCurrency(found.currency);
      setOriginalSow(found.originalSow);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setProjectError(null);
    setIsSavingProject(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjName,
          clientName: newClientName,
          clientEmail: newClientEmail,
          hourlyRateCents: Math.round(newRate * 100),
          currency: newCurrency,
          originalSow: newSow,
        }),
      });
      const data = (await res.json()) as { project?: Project; error?: string };
      if (!res.ok || !data.project) {
        throw new Error(data.error || 'Could not save project');
      }

      await refreshSnapshot();
      setSelectedProjectId(data.project.id);
      setProjectName(data.project.name);
      setClientName(data.project.clientName);
      setClientEmail(data.project.clientEmail);
      setHourlyRate(data.project.hourlyRateCents / 100);
      setCurrency(data.project.currency);
      setOriginalSow(data.project.originalSow);
      setNewProjName('');
      setNewClientName('');
      setNewClientEmail('');
      setNewSow('');
      setShowNewProject(false);
    } catch (err) {
      setProjectError(err instanceof Error ? err.message : 'Unable to save project');
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuditError(null);
    setIsAuditing(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId || null,
          projectName,
          hourlyRateCents: Math.round(hourlyRate * 100),
          currency,
          originalSow,
          clientMessage,
        }),
      });
      const data = (await res.json()) as { analysis?: ScopeAnalysis; error?: string };
      if (!res.ok || !data.analysis) {
        throw new Error(data.error || 'Audit failed');
      }
      setLatestAnalysis(data.analysis);
      await refreshSnapshot();
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleMintFromAnalysis = async () => {
    if (!latestAnalysis) return;
    setAuditError(null);
    setIsMinting(true);
    try {
      const res = await fetch('/api/change-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId || null,
          analysisId: latestAnalysis.id,
          agencyName: snapshot.profile.agencyName,
          projectName: latestAnalysis.projectName,
          clientName,
          clientEmail,
          title: `Add-On: ${latestAnalysis.requestedDeliverables[0]?.title ?? 'Scope Addendum'}`,
          summary: latestAnalysis.summary,
          deliverables: latestAnalysis.requestedDeliverables,
          estimatedHours: latestAnalysis.totalEstimatedHours,
          amountCents: Math.max(500, latestAnalysis.recommendedAmountCents),
          currency: latestAnalysis.currency,
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Could not create Change Order');
      }
      await refreshSnapshot();
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : 'Minting failed');
    } finally {
      setIsMinting(false);
    }
  };

  const handleCopyTokenLink = async (token: string, id: string) => {
    const url = `${window.location.origin}/approve/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleManageBilling = async () => {
    setBillingLoading(true);
    try {
      const endpoint = snapshot.profile.stripeCustomerId
        ? '/api/stripe/portal'
        : '/api/stripe/checkout';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'studio' }),
      });
      const data = (await res.json()) as {
        portalUrl?: string;
        checkoutUrl?: string;
        error?: string;
      };
      const target = data.portalUrl || data.checkoutUrl;
      if (target) {
        window.location.href = target;
      } else if (data.error) {
        setAuditError(data.error);
      }
    } finally {
      setBillingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center gap-2.5 rounded-lg pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <LogoMark className="h-8 w-8" />
              <span className="text-base font-extrabold text-slate-900">DriftMint</span>
            </Link>
            <span className="hidden h-5 w-px bg-slate-200 sm:inline-block" />
            <span className="hidden text-sm font-semibold text-slate-600 sm:inline-block">
              {snapshot.profile.agencyName}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              <span
                className={`h-2 w-2 rounded-full ${
                  snapshot.mode === 'supabase' ? 'bg-emerald-600' : 'bg-amber-500'
                }`}
              />
              {snapshot.mode === 'supabase' ? 'Supabase Live' : 'Local Sandbox Mode'}
            </span>

            <button
              type="button"
              disabled={billingLoading}
              onClick={handleManageBilling}
              className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-800 transition hover:bg-slate-50"
            >
              {billingLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <CreditCard className="h-4 w-4 text-blue-600" aria-hidden="true" />
              )}
              Plan: {snapshot.profile.planTier.replace('_', ' ').toUpperCase()}
            </button>

            {snapshot.mode === 'supabase' && (
              <button
                type="button"
                onClick={async () => {
                  const supabase = createSupabaseBrowserClient();
                  await supabase.auth.signOut();
                  window.location.href = '/login';
                }}
                aria-label="Sign out"
                className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* KPI Row */}
        <section aria-label="Revenue recovery metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600">
              Recovered Revenue
              <DollarSign className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-emerald-700">
              {formatMoney(snapshot.metrics.recoveredRevenueCents, snapshot.profile.currency)}
            </p>
            <p className="mt-1 text-xs text-slate-600">Settled Change Orders</p>
          </div>

          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600">
              Pending Pipeline
              <TrendingUp className="h-4 w-4 text-blue-600" aria-hidden="true" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">
              {formatMoney(snapshot.metrics.pendingPipelineCents, snapshot.profile.currency)}
            </p>
            <p className="mt-1 text-xs text-slate-600">Awaiting client signature / pay</p>
          </div>

          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600">
              Protected Hours
              <Clock className="h-4 w-4 text-blue-600" aria-hidden="true" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">
              {snapshot.metrics.preventedUnbilledHours}h
            </p>
            <p className="mt-1 text-xs text-slate-600">Converted from free favors</p>
          </div>

          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600">
              Approval Rate
              <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">
              {snapshot.metrics.approvalRatePercent}%
            </p>
            <p className="mt-1 text-xs text-slate-600">Client sign-off conversion</p>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          {/* Left: Scope Drift Analyzer */}
          <div className="space-y-6 lg:col-span-7">
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900">
                    New Scope-Drift Audit
                  </h1>
                  <p className="text-sm text-slate-600">
                    Select a project SOW baseline and paste the client&apos;s latest request.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowNewProject((prev) => !prev)}
                  className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 text-xs font-bold text-blue-700 hover:bg-blue-100"
                >
                  <FolderPlus className="h-4 w-4" aria-hidden="true" />
                  {showNewProject ? 'Close Form' : 'New SOW Project'}
                </button>
              </div>

              {showNewProject && (
                <form
                  onSubmit={handleCreateProject}
                  className="mt-5 rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3"
                >
                  <h2 className="text-sm font-extrabold text-slate-900">
                    Register Client Project & SOW Baseline
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      required
                      placeholder="Project name (e.g. Acme Redesign)"
                      value={newProjName}
                      onChange={(e) => setNewProjName(e.target.value)}
                      className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Client contact name"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm"
                    />
                    <input
                      type="email"
                      required
                      placeholder="client@company.com"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={25}
                        required
                        value={newRate}
                        onChange={(e) => setNewRate(Number(e.target.value) || 150)}
                        className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                      />
                      <select
                        value={newCurrency}
                        onChange={(e) => setNewCurrency(e.target.value as Currency)}
                        className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-2 text-sm"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="CAD">CAD</option>
                      </select>
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    required
                    placeholder="Paste signed Statement of Work deliverables & exclusions..."
                    value={newSow}
                    onChange={(e) => setNewSow(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
                  />
                  {projectError && (
                    <p className="text-xs font-semibold text-red-700">{projectError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={isSavingProject}
                    className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {isSavingProject ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    )}
                    Save SOW Project
                  </button>
                </form>
              )}

              <form onSubmit={handleRunAudit} className="mt-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label htmlFor="dash-project-select" className="block text-xs font-bold uppercase text-slate-700">
                      Project Baseline
                    </label>
                    <select
                      id="dash-project-select"
                      value={selectedProjectId}
                      onChange={(e) => handleSelectProject(e.target.value)}
                      className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900"
                    >
                      {snapshot.projects.map((proj) => (
                        <option key={proj.id} value={proj.id}>
                          {proj.name} — {proj.clientName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="dash-rate" className="block text-xs font-bold uppercase text-slate-700">
                      Rate ({currency}/hr)
                    </label>
                    <input
                      id="dash-rate"
                      type="number"
                      min={25}
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value) || 150)}
                      className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="dash-sow" className="block text-xs font-bold uppercase text-slate-700">
                    Original SOW Baseline
                  </label>
                  <textarea
                    id="dash-sow"
                    rows={3}
                    required
                    value={originalSow}
                    onChange={(e) => setOriginalSow(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-relaxed"
                  />
                </div>

                <div>
                  <label htmlFor="dash-message" className="block text-xs font-bold uppercase text-slate-700">
                    Client Request (Slack / Email / Call Notes)
                  </label>
                  <textarea
                    id="dash-message"
                    rows={4}
                    required
                    placeholder="e.g. Hey! Can we also add a Zapier webhook integration and custom admin CSV export before Friday?"
                    value={clientMessage}
                    onChange={(e) => setClientMessage(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-relaxed"
                  />
                </div>

                {auditError && (
                  <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {auditError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAuditing}
                  className="flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {isAuditing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Analyzing Scope Drift...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      Run AI Scope-Drift Audit
                    </>
                  )}
                </button>
              </form>
            </div>

            {latestAnalysis && (
              <div className="glass-panel rounded-2xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase text-amber-900">
                      Drift Score: {latestAnalysis.driftScore}/100 · {latestAnalysis.severity}
                    </span>
                    <p className="mt-2 text-sm text-slate-700">{latestAnalysis.summary}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase text-slate-500">Recommended Fee</p>
                    <p className="text-2xl font-extrabold text-emerald-700">
                      {formatMoney(latestAnalysis.recommendedAmountCents, latestAnalysis.currency)}
                    </p>
                    <p className="text-xs font-semibold text-slate-600">
                      {latestAnalysis.totalEstimatedHours} estimated hrs
                    </p>
                  </div>
                </div>

                <ul className="space-y-2">
                  {latestAnalysis.requestedDeliverables.map((item, idx) => (
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

                <button
                  type="button"
                  disabled={isMinting}
                  onClick={handleMintFromAnalysis}
                  className="flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-800 disabled:opacity-60"
                >
                  {isMinting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Minting Change Order...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      Mint Payable Change Order ({formatMoney(latestAnalysis.recommendedAmountCents, latestAnalysis.currency)})
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Right: Change Orders Ledger */}
          <div className="lg:col-span-5">
            <div className="glass-panel rounded-2xl p-6">
              <h2 className="text-lg font-extrabold text-slate-900">Change Orders Ledger</h2>
              <p className="mt-1 text-xs text-slate-600">
                Share the approval link in Slack or email. Clients sign and pay in 30 seconds.
              </p>

              <div className="mt-5 space-y-3">
                {snapshot.changeOrders.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                    No Change Orders minted yet. Run an audit on the left to generate your first link.
                  </p>
                ) : (
                  snapshot.changeOrders.map((order) => {
                    const badgeStyle =
                      order.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : order.status === 'approved'
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'declined'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-900';

                    return (
                      <div
                        key={order.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${badgeStyle}`}
                            >
                              {order.status}
                            </span>
                            <h3 className="mt-1.5 text-sm font-bold text-slate-900">
                              {order.title}
                            </h3>
                            <p className="text-xs text-slate-600">
                              {order.projectName} · {order.clientName}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-extrabold text-slate-900">
                              {formatMoney(order.amountCents, order.currency)}
                            </p>
                            <p className="text-[11px] font-medium text-slate-500">
                              {order.estimatedHours}h · {formatShortDate(order.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyTokenLink(order.publicToken, order.id)}
                            className="inline-flex min-h-[40px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            {copiedId === order.id ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                                Copied Link
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                                Copy Client Link
                              </>
                            )}
                          </button>
                          <Link
                            href={`/approve/${order.publicToken}`}
                            className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800"
                          >
                            Preview
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
