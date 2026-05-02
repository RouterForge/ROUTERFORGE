import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getPlan, getPeriod, priceFor, periodIdToCycle } from '@/lib/plans';
import { createPolarCheckout } from '@/services/polar';
import { createBinanceOrder } from '@/services/binance-pay';
import { createBybitInvoice } from '@/services/bybit-pay';
import { createCryptoOrder } from '@/services/crypto-pay';

/**
 * Unified checkout creator.
 *
 * Required body:
 *   { planId, periodId, method }
 *
 * `method` is one of: card | binance | bybit | crypto. Each routes to the
 * matching provider and returns a hosted checkout URL plus a Payment row in
 * PENDING state. The webhook will flip the Payment + Subscription to
 * SUCCEEDED / ACTIVE.
 *
 * Returns JSON `{ url }` for fetch/JSON callers, or 303 redirects to that
 * URL for plain form posts (so the pricing page can use a `<form>`).
 */
const schema = z.object({
  planId: z.string(),
  periodId: z.string(),
  method: z.enum(['card', 'binance', 'bybit', 'crypto']).default('card'),
});

function wantsJson(req: Request) {
  const ct = req.headers.get('content-type') ?? '';
  return ct.includes('application/json');
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const json = wantsJson(req);

  const user = await getSessionUser().catch(() => null);
  if (!user) {
    return json
      ? NextResponse.json({ error: 'auth' }, { status: 401 })
      : NextResponse.redirect(new URL('/sign-in?next=/pricing', url), 303);
  }

  let payload: z.infer<typeof schema>;
  try {
    if (json) payload = schema.parse(await req.json());
    else {
      const fd = await req.formData();
      payload = schema.parse({
        planId: fd.get('planId'),
        periodId: fd.get('periodId'),
        method: fd.get('method') ?? 'card',
      });
    }
  } catch {
    return json
      ? NextResponse.json({ error: 'invalid' }, { status: 400 })
      : NextResponse.redirect(new URL('/pricing?checkout=invalid', url), 303);
  }

  const plan = getPlan(payload.planId);
  const period = getPeriod(payload.periodId);
  if (!plan) {
    return json
      ? NextResponse.json({ error: 'unknown plan' }, { status: 400 })
      : NextResponse.redirect(new URL('/pricing?checkout=invalid', url), 303);
  }

  const amount = priceFor(plan, period);
  const successUrl = new URL('/billing?checkout=ok', url).toString();
  const cancelUrl = new URL('/pricing?checkout=cancel', url).toString();
  const cycle = periodIdToCycle(period.id);

  // Persist a PENDING Payment immediately so we can correlate the webhook later.
  let paymentId: string | undefined;
  try {
    await db.plan.upsert({
      where: { id: plan.id },
      create: {
        id: plan.id,
        name: plan.name,
        tagline: plan.subtitle,
        families: JSON.stringify(plan.families),
        requestsPerDay: 5_000,
        priceDaily: plan.baseMonth / 30,
        priceWeekly: (plan.baseMonth / 30) * 7,
        priceMonthly: plan.baseMonth,
        priceYearly: plan.baseMonth * 12,
        badge: plan.badge ?? null,
      },
      update: {},
    });
    const payment = await db.payment.create({
      data: {
        userId: user.id,
        provider: payload.method.toUpperCase(),
        status: 'PENDING',
        amount,
        currency: 'USD',
        raw: JSON.stringify({ planId: plan.id, periodId: period.id, cycle }),
      },
    });
    paymentId = payment.id;
  } catch {
    // DB might not be ready in dev; continue and let the user proceed via mock.
  }

  let checkoutUrl: string;
  try {
    switch (payload.method) {
      case 'card':
        checkoutUrl = await createPolarCheckout({
          userId: user.id,
          userEmail: user.email,
          planId: plan.id,
          cycle,
          amount,
          successUrl,
          cancelUrl,
        });
        break;
      case 'binance':
        checkoutUrl = await createBinanceOrder({
          userId: user.id,
          planId: plan.id,
          cycle,
          amount,
          successUrl,
          cancelUrl,
        });
        break;
      case 'bybit':
        checkoutUrl = await createBybitInvoice({
          userId: user.id,
          planId: plan.id,
          cycle,
          amount,
          successUrl,
          cancelUrl,
        });
        break;
      case 'crypto': {
        const order = createCryptoOrder({
          userId: user.id,
          planId: plan.id,
          cycle,
          amount,
        });
        checkoutUrl = order.checkoutPath;
        break;
      }
    }
  } catch (e) {
    return json
      ? NextResponse.json({ error: 'provider', detail: String(e) }, { status: 502 })
      : NextResponse.redirect(new URL('/pricing?checkout=error', url), 303);
  }

  // Embed the paymentId so mock-success / webhook can mark the right row.
  if (paymentId) {
    const join = checkoutUrl.includes('?') ? '&' : '?';
    checkoutUrl = `${checkoutUrl}${join}rf_payment=${paymentId}`;
  }

  if (json) return NextResponse.json({ url: checkoutUrl, amount, planId: plan.id });
  return NextResponse.redirect(new URL(checkoutUrl, url), 303);
}
