import React from 'react';
import { notFound } from 'next/navigation';
import { getChangeOrderByToken } from '@/lib/store';
import { ApproveChangeOrderClient } from '@/components/approve/ApproveChangeOrderClient';

export const dynamic = 'force-dynamic';

export default async function ApproveChangeOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { token } = await params;
  const resolvedSearch = await searchParams;
  const order = await getChangeOrderByToken(token);

  if (!order) {
    notFound();
  }

  return (
    <ApproveChangeOrderClient
      initialOrder={order}
      paymentQueryStatus={resolvedSearch.payment}
    />
  );
}
