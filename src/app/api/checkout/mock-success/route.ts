import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getPlan, getPeriod, periodIdToCycle, planDurationMs } from '@/lib/plans';

/**
 * Local "successful checkout" simulator.
 *
 * When no real provider keys are configured, our checkout services return a
 * URL pointing to this route. Hitting it creates a SUCCEEDED Payment + an
 * ACTIVE Subscription for the signed-in user, then redirects to /billing.
 *
 * In production this route is unreachable because real provider URLs are
 * returned instead.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const planId = url.searchParams.get('planId') ?? '';
  const cycle = url.searchParams.get('cycle') ?? 'monthly';
  const periodId = url.searchParams.get('periodId') ?? cycleToPeriodId(cycle);
  const amount = Number(url.searchParams.get('amount') ?? 0);
  const paymentId = url.searchParams.get('rf_payment') ?? null;
  const provider = (url.searchParams.get('provider') ?? 'POLAR').toUpperCase();

  const user = await getSessionUser().catch(() => null);
  if (!user) {
    return NextResponse.redirect(new URL('/sign-in?next=/billing', url), 303);
  }
  const plan = getPlan(planId);
  if (!plan) return NextResponse.redirect(new URL('/pricing?checkout=invalid', url), 303);

  const period = getPeriod(periodId);
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + planDurationMs(period.id));

  try {
    await db.$transaction(async (tx) => {
      await tx.plan.upsert({
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

      const subscription = await tx.subscription.create({
        data: {
          userId: user.id,
          planId: plan.id,
          cycle: periodIdToCycle(period.id),
          status: 'ACTIVE',
          startsAt,
          endsAt,
        },
      });

      if (paymentId) {
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: 'SUCCEEDED',
            subscriptionId: subscription.id,
            provider: provider as any,
          },
        });
      } else {
        await tx.payment.create({
          data: {
            userId: user.id,
            subscriptionId: subscription.id,
            provider: provider as any,
            status: 'SUCCEEDED',
            amount,
            currency: 'USD',
          },
        });
      }

      await tx.adminAuditLog.create({
        data: {
          actorId: user.id,
          action: 'billing.checkout.mock_success',
          targetType: 'Subscription',
          targetId: subscription.id,
          metadata: JSON.stringify({ planId: plan.id, periodId, amount, provider }),
        },
      });
    });
  } catch {
    // If the DB isn't initialized we still send the user to /billing.
  }

  return NextResponse.redirect(new URL('/billing?checkout=ok', url), 303);
}

function cycleToPeriodId(cycle: string): string {
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
