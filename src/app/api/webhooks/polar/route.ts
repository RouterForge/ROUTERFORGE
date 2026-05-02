import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPolarSignature } from '@/services/polar';
import { getPlan, planDurationMs, type PeriodId } from '@/lib/plans';

/**
 * Polar.sh webhook.
 *
 * Polar posts events like `checkout.created`, `checkout.updated`,
 * `order.created`, `subscription.created`. We listen for any event whose
 * payload tells us a payment succeeded for one of our metadata-tagged
 * checkouts and flip the matching Payment row to SUCCEEDED, creating an
 * ACTIVE Subscription if needed.
 *
 * Verification: HMAC-SHA256 over the raw body using POLAR_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get('polar-signature') ?? req.headers.get('x-signature');
  if (!verifyPolarSignature(raw, sig)) {
    return NextResponse.json({ error: 'bad signature' }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const type = event.type ?? event.event ?? '';
  const data = event.data ?? event.payload ?? event;
  const meta = data.metadata ?? data.checkout?.metadata ?? {};
  const userId = meta.userId;
  const planId = meta.planId;
  const cycle = meta.cycle ?? 'monthly';
  const periodId = (meta.periodId ?? cycleToPeriodId(cycle)) as PeriodId;
  const amount = Number(data.amount ?? data.total_amount ?? 0) / (data.currency_in_cents ? 100 : 1);

  // Only act on events that imply payment success.
  const succeeded =
    type.endsWith('.completed') ||
    type.endsWith('.succeeded') ||
    type === 'order.created' ||
    type === 'subscription.created' ||
    data.status === 'succeeded' ||
    data.status === 'paid';

  if (!succeeded || !userId || !planId) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const plan = getPlan(planId);
  if (!plan) return NextResponse.json({ received: true, ignored: true });

  try {
    await db.$transaction(async (tx) => {
      const startsAt = new Date();
      const endsAt = new Date(startsAt.getTime() + planDurationMs(periodId));

      const subscription = await tx.subscription.create({
        data: {
          userId,
          planId,
          cycle,
          status: 'ACTIVE',
          startsAt,
          endsAt,
        },
      });

      const externalId = data.id ?? data.checkout_id ?? event.id ?? null;
      const existing = externalId
        ? await tx.payment.findFirst({ where: { externalId } })
        : null;

      if (existing) {
        await tx.payment.update({
          where: { id: existing.id },
          data: { status: 'SUCCEEDED', subscriptionId: subscription.id },
        });
      } else {
        await tx.payment.create({
          data: {
            userId,
            subscriptionId: subscription.id,
            provider: 'POLAR',
            status: 'SUCCEEDED',
            amount: amount > 0 ? amount : plan.baseMonth,
            currency: 'USD',
            externalId,
            raw: JSON.stringify({ type, ...meta }),
          },
        });
      }

      await tx.adminAuditLog.create({
        data: {
          actorId: userId,
          action: 'webhook.polar.success',
          targetType: 'Subscription',
          targetId: subscription.id,
          metadata: JSON.stringify({ type, externalId }),
        },
      });
    });
  } catch (e) {
    // Surface to Polar so it retries the delivery.
    return NextResponse.json({ error: 'database', detail: String(e) }, { status: 503 });
  }

  return NextResponse.json({ received: true });
}

function cycleToPeriodId(cycle: string): PeriodId {
  switch (cycle) {
    case 'daily':
      return '1d';
    case 'weekly':
      return '1w';
    case 'yearly':
      return '1y';
    default:
      return '1m';
  }
}
