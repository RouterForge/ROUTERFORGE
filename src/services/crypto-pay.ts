import 'server-only';
import crypto from 'node:crypto';

/**
 * On-chain crypto payment.
 *
 * For self-served crypto (USDT/USDC/BTC/ETH) we generate a deposit reference
 * and surface a dedicated /checkout/crypto/[ref] page where the user can pay.
 * Webhooks from a chain-watcher (e.g. NowPayments / CoinGate / your own
 * indexer) post to /api/webhooks/crypto with a shared HMAC secret.
 */
const SECRET = process.env.CRYPTO_WEBHOOK_SECRET ?? '';

export interface CryptoOrderInput {
  userId: string;
  planId: string;
  cycle: string;
  amount: number;
}

export interface CryptoOrderResult {
  reference: string;
  /** Path the UI redirects to so the user can copy the address + confirm. */
  checkoutPath: string;
}

export function createCryptoOrder(input: CryptoOrderInput): CryptoOrderResult {
  const reference = `RF${Date.now()}${crypto.randomBytes(4).toString('hex')}`;
  const params = new URLSearchParams({
    ref: reference,
    planId: input.planId,
    cycle: input.cycle,
    amount: String(input.amount),
    userId: input.userId,
  });
  return {
    reference,
    checkoutPath: `/checkout/crypto?${params.toString()}`,
  };
}

export function verifyCryptoSignature(rawBody: string, signature: string | null): boolean {
  if (!SECRET) return true;
  if (!signature) return false;
  const expected = crypto.createHmac('sha256', SECRET).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
