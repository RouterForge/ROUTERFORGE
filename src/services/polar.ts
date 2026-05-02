import 'server-only';
import crypto from 'node:crypto';

/**
 * Minimal Polar.sh client.
 *
 * When POLAR_API_KEY is set, creates a real checkout at api.polar.sh and
 * returns the hosted checkout URL. Otherwise returns a local mock URL that
 * the checkout route interprets as "simulate success locally" — handy for
 * dev and demo environments without live keys.
 */
const API_KEY = process.env.POLAR_API_KEY ?? '';
const WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET ?? '';
const API_BASE = process.env.POLAR_API_URL ?? 'https://api.polar.sh';

export const polarConfigured = Boolean(API_KEY);

export interface CreateCheckoutInput {
  userId: string;
  userEmail: string;
  planId: string;
  cycle: 'daily' | 'weekly' | 'monthly' | 'yearly';
  amount: number;
  successUrl: string;
  cancelUrl: string;
}

export async function createPolarCheckout(input: CreateCheckoutInput): Promise<string> {
  if (!API_KEY) {
    // Dev fallback: a local URL the checkout route can recognize and simulate
    // a successful payment for the given plan/cycle.
    const params = new URLSearchParams({
      planId: input.planId,
      cycle: input.cycle,
      amount: String(input.amount),
      userId: input.userId,
    });
    return `/api/checkout/mock-success?${params.toString()}`;
  }

  const res = await fetch(`${API_BASE}/v1/checkouts/`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      customer_email: input.userEmail,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: {
        userId: input.userId,
        planId: input.planId,
        cycle: input.cycle,
      },
      // Polar's shape uses product_price_id; we pass the human amount as a fallback.
      amount: Math.round(input.amount * 100),
      currency: 'usd',
    }),
  });
  if (!res.ok) {
    throw new Error(`Polar checkout failed: ${res.status} ${await res.text().catch(() => '')}`);
  }
  const data = (await res.json()) as { url?: string };
  if (!data.url) throw new Error('Polar did not return a checkout URL');
  return data.url;
}

export function verifyPolarSignature(rawBody: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET) return true; // dev: accept anything
  if (!signature) return false;
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
