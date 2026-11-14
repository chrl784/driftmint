'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  FileSignature,
  Loader2,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { formatMoney, formatShortDate } from '@/lib/utils';
import { LogoMark } from '@/components/ui/LogoMark';
import type { ChangeOrder } from '@/types/domain';

interface ApproveChangeOrderClientProps {
  initialOrder: ChangeOrder;
  paymentQueryStatus?: string;
}

export function ApproveChangeOrderClient({
  initialOrder,
  paymentQueryStatus,
}: ApproveChangeOrderClientProps) {
  const [order, setOrder] = useState<ChangeOrder>(initialOrder);
  const [signatureName, setSignatureName] = useState(
    initialOrder.clientSignatureName ?? ''
  );
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const submitDecision = async (action: 'approve_and_pay' | 'decline') => {
    setErrorMsg(null);
    if (!signatureName.trim() || signatureName.trim().length < 2) {
      setErrorMsg('Please type your full name in the signature box.');
      return;
    }
    if (action === 'approve_and_pay' && !acceptedTerms) {
      setErrorMsg('Please confirm acceptance of the Change Order terms.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/change-orders/${order.publicToken}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureName: signatureName.trim(),
          acceptedTerms: true,
          action,
        }),
      });

      const payload = (await response.json()) as {
        changeOrder?: ChangeOrder;
        checkoutUrl?: string | null;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || 'Could not process decision');
      }

      if (payload.checkoutUrl) {
        window.location.href = payload.checkoutUrl;
        return;
      }

      if (payload.changeOrder) {
        setOrder(payload.changeOrder);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to submit Change Order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
            <LogoMark className="h-8 w-8" />
            <span>{order.agencyName}</span>
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-2xs">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            Verified Change Order
          </span>
        </div>

        {paymentQueryStatus === 'cancelled' && (
          <div role="status" className="mb-5 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
            <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
            Checkout was cancelled. Your signature is saved — you can retry payment anytime below.
          </div>
        )}

        <div className="glass-panel overflow-hidden rounded-3xl">
          <div className="border-b border-slate-200 bg-white px-6 py-6 sm:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Scope Addendum · {order.projectName}
                </p>
                <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900">
                  {order.title}
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Prepared for <strong>{order.clientName}</strong> · Issued{' '}
                  {formatShortDate(order.createdAt)}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-right">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Addendum Total
                </span>
                <span className="text-3xl font-extrabold text-emerald-700">
                  {formatMoney(order.amountCents, order.currency)}
                </span>
                <span className="mt-0.5 flex items-center justify-end gap-1 text-xs font-semibold text-emerald-800">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {order.estimatedHours} estimated hrs
                </span>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-700">{order.summary}</p>
          </div>

          <div className="bg-slate-50/70 px-6 py-6 sm:px-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Included Deliverables
            </h2>
            <ul className="mt-3 space-y-2.5">
              {order.deliverables.map((item, idx) => (
                <li
                  key={`${item.title}-${idx}`}
                  className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.title}</p>
                    <p className="mt-0.5 text-xs text-slate-600">{item.rationale}</p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                    {item.estimatedHours} hrs
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-slate-200 bg-white px-6 py-6 sm:px-8">
            {order.status === 'paid' ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden="true" />
                <h3 className="mt-2 text-lg font-extrabold text-emerald-950">
                  Change Order Approved & Paid
                </h3>
                <p className="mt-1 text-sm text-emerald-800">
                  Signed by <strong>{order.clientSignatureName || order.clientName}</strong>
                  {order.paidAt ? ` on ${formatShortDate(order.paidAt)}` : ''}. Work is queued into the active sprint.
                </p>
                <Link
                  href="/dashboard"
                  className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white hover:bg-emerald-800"
                >
                  View in Agency Dashboard
                </Link>
              </div>
            ) : order.status === 'declined' ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-100 p-6 text-center">
                <XCircle className="mx-auto h-10 w-10 text-slate-600" aria-hidden="true" />
                <h3 className="mt-2 text-lg font-extrabold text-slate-900">
                  Change Order Declined
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  This addendum was declined. Delivery continues under the original Phase 1 SOW only.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="client-signature"
                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    <FileSignature className="h-4 w-4 text-blue-600" aria-hidden="true" />
                    Electronic Signature (Full Legal Name)
                  </label>
                  <input
                    id="client-signature"
                    type="text"
                    required
                    placeholder="Type your full name (e.g. Elena Rostova)"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-700">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                  <span>
                    I authorize <strong>{order.agencyName}</strong> to execute this Scope Addendum for{' '}
                    <strong>{formatMoney(order.amountCents, order.currency)}</strong> under the existing Master Service Agreement.
                  </span>
                </label>

                {errorMsg && (
                  <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {errorMsg}
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => submitDecision('approve_and_pay')}
                    className="flex min-h-[52px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 text-base font-bold text-white shadow-sm transition hover:bg-orange-800 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" aria-hidden="true" />
                        Sign & Pay {formatMoney(order.amountCents, order.currency)}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => submitDecision('decline')}
                    className="flex min-h-[52px] cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Keep Original Scope Only
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
