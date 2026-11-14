import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 text-center">
      <div className="glass-panel max-w-md rounded-3xl p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <ShieldAlert className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
          Change Order Not Found
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          This approval link may have expired or the token is invalid. Contact your agency lead for an updated link.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to DriftMint
        </Link>
      </div>
    </div>
  );
}
