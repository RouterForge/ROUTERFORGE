import 'server-only';
import { db } from '@/lib/db';

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
    if (subs.length === 0) return [];
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
    return [];
  }
}
