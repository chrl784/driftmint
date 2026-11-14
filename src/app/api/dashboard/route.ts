import { NextResponse } from 'next/server';
import { getDashboardSnapshot } from '@/lib/store';

export async function GET() {
  try {
    const snapshot = await getDashboardSnapshot();
    return NextResponse.json(snapshot, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load dashboard';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
