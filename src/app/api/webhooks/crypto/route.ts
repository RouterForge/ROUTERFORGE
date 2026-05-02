import { NextResponse } from 'next/server';
import { verifyCryptoSignature } from '@/services/crypto-pay';
import { settleSuccessfulPayment } from '@/services/billing';

/**
 * Generic on-chain crypto webhook.
 *
 * Expected payload shape:
 * {
 *   "reference": "RF...",
 *   "status": "confirmed" | "paid",
 *   "amount": 119.0,
 *   "currency": "USDT",
 *   "txHash": "0x...",
 *   "metadata": { "userId": "...", "planId": "...", "cycle": "monthly" }
 * }
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get('x-rf-signature') ?? req.headers.get('x-signature');
  if (!verifyCryptoSignature(raw, sig)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const status = String(event.status ?? '').toLowerCase();
  if (!['confirmed', 'paid', 'success', 'completed'].includes(status)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const meta = event.metadata ?? {};
  const userId = meta.userId;
  const planId = meta.planId;
  const cycle = meta.cycle ?? 'monthly';
  if (!userId || !planId) return NextResponse.json({ ok: true, ignored: true });

  await settleSuccessfulPayment({
    userId,
    planId,
    cycle,
    amount: Number(event.amount ?? 0),
    provider: 'CRYPTO',
    externalId: event.reference ?? event.txHash ?? null,
    raw: { txHash: event.txHash, currency: event.currency },
  }).catch(() => null);

  return NextResponse.json({ ok: true });
}
