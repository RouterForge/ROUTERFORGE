import { NextResponse } from 'next/server';
import { verifyBinanceSignature } from '@/services/binance-pay';
import { settleSuccessfulPayment } from '@/services/billing';

/**
 * Binance Pay webhook.
 *
 * On `PAY_SUCCESS` we settle the matching payment and create the subscription.
 * Verification: HMAC-SHA512 over `${ts}\n${nonce}\n${body}\n` using the
 * merchant secret.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const ts = req.headers.get('binancepay-timestamp');
  const nonce = req.headers.get('binancepay-nonce');
  const sig = req.headers.get('binancepay-signature');
  if (!verifyBinanceSignature(raw, ts, nonce, sig)) {
    return NextResponse.json({ returnCode: 'FAIL', returnMessage: 'bad signature' }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ returnCode: 'FAIL', returnMessage: 'bad json' }, { status: 400 });
  }

  if (event.bizStatus !== 'PAY_SUCCESS') {
    return NextResponse.json({ returnCode: 'SUCCESS', returnMessage: null });
  }

  let pass: any = {};
  try {
    pass = JSON.parse(event.data?.passThroughInfo ?? event.passThroughInfo ?? '{}');
  } catch {
    pass = {};
  }
  const { userId, planId, cycle = 'monthly' } = pass;
  if (!userId || !planId) {
    return NextResponse.json({ returnCode: 'SUCCESS', returnMessage: null });
  }

  await settleSuccessfulPayment({
    userId,
    planId,
    cycle,
    amount: Number(event.data?.orderAmount ?? 0),
    provider: 'BINANCE',
    externalId: event.data?.merchantTradeNo ?? event.data?.orderId ?? null,
    raw: { bizType: event.bizType, bizId: event.bizId },
  }).catch(() => null);

  return NextResponse.json({ returnCode: 'SUCCESS', returnMessage: null });
}
