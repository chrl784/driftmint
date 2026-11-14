import { NextRequest, NextResponse } from 'next/server';
import { getChangeOrderByToken } from '@/lib/store';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const order = await getChangeOrderByToken(token);

    if (!order) {
      return NextResponse.json({ error: 'Change Order not found' }, { status: 404 });
    }

    return NextResponse.json({ changeOrder: order }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to fetch Change Order';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
