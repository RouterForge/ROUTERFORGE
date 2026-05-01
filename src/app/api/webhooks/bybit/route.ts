import { NextResponse } from 'next/server';

/** Bybit Pay webhook shell — verify signature with BYBIT_PAY_SECRET in prod. */
export async function POST(req: Request) {
  const _body = await req.text();
  return NextResponse.json({ retCode: 0, retMsg: 'OK' });
}
