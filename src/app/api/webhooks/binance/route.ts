import { NextResponse } from 'next/server';

/** Binance Pay webhook shell — verify signature with BINANCE_PAY_SECRET in prod. */
export async function POST(req: Request) {
  const _body = await req.text();
  return NextResponse.json({ returnCode: 'SUCCESS', returnMessage: null });
}
