import 'server-only';
import crypto from 'node:crypto';

/**
 * Binance Pay API client.
 *
 * Docs: https://developers.binance.com/docs/binance-pay/api-order-create
 *
 * Each request must include `BinancePay-Timestamp`, `BinancePay-Nonce`,
 * `BinancePay-Certificate-SN` and `BinancePay-Signature`. The signature is
 * an HMAC-SHA512 hex digest (uppercased) of `${timestamp}\n${nonce}\n${body}\n`
 * using the secret key.
 *
 * When BINANCE_PAY_API_KEY is unset we return a local mock URL so dev keeps
 * working.
 */
const API_KEY = process.env.BINANCE_PAY_API_KEY ?? '';
const SECRET = process.env.BINANCE_PAY_SECRET ?? '';
const API_BASE = process.env.BINANCE_PAY_BASE ?? 'https://bpay.binanceapi.com';

export const binanceConfigured = Boolean(API_KEY && SECRET);

export interface BinanceOrderInput {
  userId: string;
  planId: string;
  cycle: string;
  amount: number;
  successUrl: string;
  cancelUrl: string;
}

function nonce(): string {
  return crypto.randomBytes(16).toString('hex');
}

function sign(body: string, ts: string, n: string): string {
  return crypto
    .createHmac('sha512', SECRET)
    .update(`${ts}\n${n}\n${body}\n`)
    .digest('hex')
    .toUpperCase();
}

export async function createBinanceOrder(input: BinanceOrderInput): Promise<string> {
  if (!binanceConfigured) {
    const params = new URLSearchParams({
      provider: 'binance',
      planId: input.planId,
      cycle: input.cycle,
      amount: String(input.amount),
      userId: input.userId,
    });
    return `/api/checkout/mock-success?${params.toString()}`;
  }

  const body = JSON.stringify({
    env: { terminalType: 'WEB' },
    merchantTradeNo: `RF${Date.now()}${crypto.randomBytes(4).toString('hex')}`.slice(0, 32),
    orderAmount: input.amount,
    currency: 'USDT',
    goods: {
      goodsType: '02',
      goodsCategory: 'D000',
      referenceGoodsId: input.planId,
      goodsName: `RouterForge ${input.planId}`,
      goodsDetail: `RouterForge ${input.planId} (${input.cycle})`,
    },
    returnUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    passThroughInfo: JSON.stringify({
      userId: input.userId,
      planId: input.planId,
      cycle: input.cycle,
    }),
  });

  const ts = String(Date.now());
  const n = nonce();
  const sig = sign(body, ts, n);

  const res = await fetch(`${API_BASE}/binancepay/openapi/v3/order`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'BinancePay-Timestamp': ts,
      'BinancePay-Nonce': n,
      'BinancePay-Certificate-SN': API_KEY,
      'BinancePay-Signature': sig,
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`Binance Pay order failed: ${res.status} ${await res.text().catch(() => '')}`);
  }
  const data = (await res.json()) as { data?: { checkoutUrl?: string; universalUrl?: string } };
  const url = data.data?.checkoutUrl ?? data.data?.universalUrl;
  if (!url) throw new Error('Binance Pay did not return a checkout URL');
  return url;
}

/** Verify webhook signature using merchant secret. */
export function verifyBinanceSignature(
  rawBody: string,
  ts: string | null,
  n: string | null,
  signature: string | null,
): boolean {
  if (!SECRET) return true;
  if (!ts || !n || !signature) return false;
  const expected = sign(rawBody, ts, n);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
