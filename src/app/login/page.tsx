'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, Mail, Lock } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { LogoMark } from '@/components/ui/LogoMark';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup' | 'magic'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const isConfigured =
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'string' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://') &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!isConfigured) {
      router.push('/dashboard');
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();

      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setInfoMsg('Magic link sent! Check your inbox to access your DriftMint dashboard.');
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { agency_name: agencyName.trim() || 'My Studio' },
          },
        });
        if (error) throw error;
        setInfoMsg('Account created! Check your email to confirm, or sign in directly if email confirmation is disabled.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <LogoMark className="h-10 w-10" />
            <span className="text-xl font-extrabold text-slate-900">DriftMint</span>
          </Link>
        </div>

        <div className="glass-panel rounded-3xl p-7">
          <h1 className="text-2xl font-extrabold text-slate-900">
            {mode === 'signup'
              ? 'Create your agency account'
              : mode === 'magic'
                ? 'Sign in with Magic Link'
                : 'Sign in to DriftMint'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Protect your project margins and manage client Change Orders.
          </p>

          {!isConfigured && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-medium text-amber-900">
              Supabase env vars are not set yet — submitting opens Local Sandbox Mode directly.
            </div>
          )}

          <div className="mt-5 grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1">
            {(['signin', 'signup', 'magic'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setMode(tab);
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className={`min-h-[40px] cursor-pointer rounded-lg text-xs font-bold transition ${
                  mode === tab
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'signin' ? 'Sign In' : tab === 'signup' ? 'Sign Up' : 'Magic Link'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-agency" className="block text-xs font-bold uppercase text-slate-700">
                  Agency / Studio Name
                </label>
                <input
                  id="auth-agency"
                  type="text"
                  required
                  placeholder="Northstar Digital"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm"
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-700">
                <Mail className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                Work Email
              </label>
              <input
                id="auth-email"
                type="email"
                required
                placeholder="founder@agency.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm"
              />
            </div>

            {mode !== 'magic' && (
              <div>
                <label htmlFor="auth-password" className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-700">
                  <Lock className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm"
                />
              </div>
            )}

            {errorMsg && (
              <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                {errorMsg}
              </div>
            )}

            {infoMsg && (
              <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                {infoMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  {mode === 'signup'
                    ? 'Create Account'
                    : mode === 'magic'
                      ? 'Send Magic Link'
                      : 'Sign In to Dashboard'}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
