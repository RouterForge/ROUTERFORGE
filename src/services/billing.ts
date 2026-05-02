import 'server-only';
import { db } from '@/lib/db';
import { getPlan, planDurationMs, type PeriodId } from '@/lib/plans';

export type SuccessProvider = 'POLAR' | 'BINANCE' | 'BYBIT' | 'CRYPTO' | 'MANUAL';

export interface SettleSuccessInput {
  userId: string;
  planId: string;
  cycle: string;
  periodId?: PeriodId;
  amount: number;
  provider: SuccessProvider;
  externalId?: string | null;
  raw?: Record<string, unknown>;
}

/**
 * Idempotently mark a checkout as successful: ensures the Plan row exists,
 * creates an active Subscription, and creates (or updates) a SUCCEEDED Payment.
 *
 * Returns the resulting subscription id, or null if the plan is unknown.
 */
export async function settleSuccessfulPayment(
  input: SettleSuccessInput,
): Promise<string | null> {
  const plan = getPlan(input.planId);
  if (!plan) return null;
  const periodId = input.periodId ?? cycleToPeriodId(input.cycle);
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + planDurationMs(periodId));

  return await db.$transaction(async (tx) => {
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

    if (input.externalId) {
      const dup = await tx.payment.findFirst({ where: { externalId: input.externalId, status: 'SUCCEEDED' } });
      if (dup) return dup.subscriptionId;
    }

    const subscription = await tx.subscription.create({
      data: {
        userId: input.userId,
        planId: plan.id,
        cycle: input.cycle,
        status: 'ACTIVE',
        startsAt,
        endsAt,
      },
    });

    const existingPending = input.externalId
      ? await tx.payment.findFirst({ where: { externalId: input.externalId } })
      : null;

    if (existingPending) {
      await tx.payment.update({
        where: { id: existingPending.id },
        data: {
          status: 'SUCCEEDED',
          subscriptionId: subscription.id,
        },
      });
    } else {
      await tx.payment.create({
        data: {
          userId: input.userId,
          subscriptionId: subscription.id,
          provider: input.provider as any,
          status: 'SUCCEEDED',
          amount: input.amount > 0 ? input.amount : plan.baseMonth,
          currency: 'USD',
          externalId: input.externalId ?? null,
          raw: input.raw ? JSON.stringify(input.raw) : null,
        },
      });
    }

    await tx.adminAuditLog.create({
      data: {
        actorId: input.userId,
        action: `webhook.${input.provider.toLowerCase()}.success`,
        targetType: 'Subscription',
        targetId: subscription.id,
        metadata: input.raw ? JSON.stringify(input.raw) : null,
      },
    });

    return subscription.id;
  });
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
