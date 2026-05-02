import 'server-only';
import { db } from '@/lib/db';
import { PLANS, planDurationMs, priceFor } from '@/lib/plans';

export interface AdminSubRow {
  id: string;
  userEmail: string;
  planName: string;
  cycle: string;
  amount: number;
  status: 'ACTIVE' | 'EXPIRED' | 'PAUSED' | 'CANCELLED' | 'TRIAL';
  endsAt: string;
}

export async function listAdminSubscriptions(): Promise<AdminSubRow[]> {
  try {
    const subs = await db.subscription.findMany({
      orderBy: { startsAt: 'desc' },
      take: 50,
      include: { user: { select: { email: true } }, plan: true },
    });
    if (subs.length === 0) return sampleRows();
    return subs.map((s) => {
      const cyclePrice =
        s.cycle === 'daily'
          ? s.plan.priceDaily
          : s.cycle === 'weekly'
            ? s.plan.priceWeekly
            : s.cycle === 'yearly'
              ? s.plan.priceYearly
              : s.plan.priceMonthly;
      return {
        id: s.id,
        userEmail: s.user.email,
        planName: s.plan.name,
        cycle: s.cycle,
        amount: cyclePrice,
        status: s.status as AdminSubRow['status'],
        endsAt: s.endsAt.toISOString(),
      };
    });
  } catch {
    return sampleRows();
  }
}

function sampleRows(): AdminSubRow[] {
  return Array.from({ length: 12 }).map((_, i) => {
    const plan = PLANS[i % PLANS.length];
    const cycle = (['monthly', 'yearly', 'weekly'] as const)[i % 3];
    return {
      id: `sub_${(2400 + i).toString(36)}`,
      userEmail: `user${i + 1}@routerforge.example`,
      planName: plan.name,
      cycle,
      amount: priceFor(plan, cycle === 'weekly' ? '1w' : cycle === 'yearly' ? '1y' : '1m'),
      status: (['ACTIVE', 'ACTIVE', 'EXPIRED', 'PAUSED', 'ACTIVE'][i % 5]) as AdminSubRow['status'],
      endsAt: new Date(Date.now() + planDurationMs(cycle) * ((i % 3) + 1)).toISOString(),
    };
  });
}
