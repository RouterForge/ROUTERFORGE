import { NextResponse } from 'next/server';

/** Generic on-chain webhook shell. Verify against CRYPTO_WEBHOOK_SECRET. */
export async function POST(req: Request) {
  const _body = await req.text();
  return NextResponse.json({ ok: true });
}
