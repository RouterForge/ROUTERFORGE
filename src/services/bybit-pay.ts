import 'server-only';
import crypto from 'node:crypto';

/**
 * Bybit Pay invoice creator.
 *
 * Docs: https://bybit-exchange.github.io/docs/payapi/invoice/create
 * Authentication uses the Bybit V5 signing scheme:
 *   sign = HMAC-SHA256(secret, ts + apiKey + recvWindow + payload)
 *
 * Falls back to a local mock URL when keys are not configured.
 */
const API_KEY = process.env.BYBIT_PAY_API_KEY ?? '';
const SECRET = process.env.BYBIT_PAY_SECRET ?? '';
const API_BASE = process.env.BYBIT_PAY_BASE ?? 'https://api.bybit.com';
const RECV_WINDOW = '5000';

export const bybitConfigured = Boolean(API_KEY && SECRET);

export interface BybitOrderInput {
  userId: string;
  planId: string;
  cycle: string;
  amount: number;
  successUrl: string;
  cancelUrl: string;
}

function sign(ts: string, payload: string): string {
  return crypto
    .createHmac('sha256', SECRET)
    .update(ts + API_KEY + RECV_WINDOW + payload)
    .digest('hex');
}

export async function createBybitInvoice(input: BybitOrderInput): Promise<string> {
  if (!bybitConfigured) {
    const params = new URLSearchParams({
      provider: 'bybit',
      planId: input.planId,
      cycle: input.cycle,
      amount: String(input.amount),
      userId: input.userId,
    });
    return `/api/checkout/mock-success?${params.toString()}`;
  }

  const ts = String(Date.now());
  const payload = JSON.stringify({
    merchantOrderNo: `RF${Date.now()}${crypto.randomBytes(3).toString('hex')}`,
    fiatCurrency: 'USD',
    fiatAmount: String(input.amount.toFixed(2)),
    productName: `RouterForge ${input.planId}`,
    productDetail: `RouterForge ${input.planId} (${input.cycle})`,
    returnUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    extraInfo: JSON.stringify({
      userId: input.userId,
      planId: input.planId,
      cycle: input.cycle,
    }),
  });
  const sig = sign(ts, payload);

  const res = await fetch(`${API_BASE}/v5/pay/invoice/create`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-BAPI-API-KEY': API_KEY,
      'X-BAPI-TIMESTAMP': ts,
      'X-BAPI-RECV-WINDOW': RECV_WINDOW,
      'X-BAPI-SIGN': sig,
    },
    body: payload,
  });
  if (!res.ok) {
    throw new Error(`Bybit Pay invoice failed: ${res.status} ${await res.text().catch(() => '')}`);
  }
  const data = (await res.json()) as { result?: { paymentUrl?: string; checkoutUrl?: string } };
  const url = data.result?.paymentUrl ?? data.result?.checkoutUrl;
  if (!url) throw new Error('Bybit Pay did not return a checkout URL');
  return url;
}

export function verifyBybitSignature(
  rawBody: string,
  ts: string | null,
  signature: string | null,
): boolean {
  if (!SECRET) return true;
  if (!ts || !signature) return false;
  const expected = crypto
    .createHmac('sha256', SECRET)
    .update(ts + rawBody)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
