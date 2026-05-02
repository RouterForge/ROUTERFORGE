import { NextResponse } from 'next/server';
import { verifyBybitSignature } from '@/services/bybit-pay';
import { settleSuccessfulPayment } from '@/services/billing';

/**
 * Bybit Pay webhook.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const ts = req.headers.get('x-bapi-timestamp') ?? req.headers.get('x-bybit-timestamp');
  const sig = req.headers.get('x-bapi-sign') ?? req.headers.get('x-bybit-signature');
  if (!verifyBybitSignature(raw, ts, sig)) {
    return NextResponse.json({ retCode: 1, retMsg: 'bad signature' }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ retCode: 1, retMsg: 'bad json' }, { status: 400 });
  }

  const data = event.data ?? event;
  const status = data.status ?? data.payStatus ?? '';
  if (!['SUCCESS', 'PAID', 'COMPLETED'].includes(String(status).toUpperCase())) {
    return NextResponse.json({ retCode: 0, retMsg: 'OK' });
  }

  let extra: any = {};
  try {
    extra = JSON.parse(data.extraInfo ?? '{}');
  } catch {
    extra = {};
  }
  const { userId, planId, cycle = 'monthly' } = extra;
  if (!userId || !planId) return NextResponse.json({ retCode: 0, retMsg: 'OK' });

  await settleSuccessfulPayment({
    userId,
    planId,
    cycle,
    amount: Number(data.fiatAmount ?? data.amount ?? 0),
    provider: 'BYBIT',
    externalId: data.merchantOrderNo ?? data.orderId ?? null,
    raw: { event: event.topic ?? 'pay.invoice' },
  }).catch(() => null);

  return NextResponse.json({ retCode: 0, retMsg: 'OK' });
}
