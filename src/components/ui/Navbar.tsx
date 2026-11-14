'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, X } from 'lucide-react';
import { LogoMark } from './LogoMark';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2.5 rounded-lg pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          <LogoMark className="h-9 w-9 shrink-0" />
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight text-slate-900">
              DriftMint
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              Scope Guard
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
          <a
            href="#live-auditor"
            className="min-h-[44px] inline-flex items-center text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md px-2"
          >
            Live Scope Test
          </a>
          <a
            href="#how-it-works"
            className="min-h-[44px] inline-flex items-center text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md px-2"
          >
            Workflow
          </a>
          <a
            href="#pricing"
            className="min-h-[44px] inline-flex items-center text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md px-2"
          >
            Pricing
          </a>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/dashboard"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-xs transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Agency Dashboard
          </Link>
          <a
            href="#live-auditor"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Audit a Client Message
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 pb-5 pt-3 md:hidden">
          <div className="flex flex-col gap-2">
            <a
              href="#live-auditor"
              onClick={() => setMobileOpen(false)}
              className="flex min-h-[44px] items-center rounded-lg px-3 text-base font-semibold text-slate-700 hover:bg-slate-50"
            >
              Live Scope Test
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileOpen(false)}
              className="flex min-h-[44px] items-center rounded-lg px-3 text-base font-semibold text-slate-700 hover:bg-slate-50"
            >
              Workflow
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileOpen(false)}
              className="flex min-h-[44px] items-center rounded-lg px-3 text-base font-semibold text-slate-700 hover:bg-slate-50"
            >
              Pricing
            </a>
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="mt-2 flex min-h-[44px] items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white"
            >
              Open Agency Dashboard
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
