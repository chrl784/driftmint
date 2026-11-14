import React from 'react';
import { redirect } from 'next/navigation';
import { isSupabaseConfigured } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getDashboardSnapshot } from '@/lib/store';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }
  }

  const snapshot = await getDashboardSnapshot();
  return <DashboardClient initialSnapshot={snapshot} />;
}
