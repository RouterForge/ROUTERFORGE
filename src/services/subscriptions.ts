import 'server-only';
import { db } from '@/lib/db';

export interface ActiveSubscriptionSummary {
  id: string;
  planId: string;
  planName: string;
  cycle: string;
  status: string;
  startsAt: Date;
  endsAt: Date;
}

export async function getActiveSubscription(
  userId: string,
): Promise<ActiveSubscriptionSummary | null> {
  try {
    const sub = await db.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { startsAt: 'desc' },
      include: { plan: true },
    });
    if (!sub) return null;
    return {
      id: sub.id,
      planId: sub.planId,
      planName: sub.plan.name,
      cycle: sub.cycle,
      status: sub.status,
      startsAt: sub.startsAt,
      endsAt: sub.endsAt,
    };
  } catch {
    return null;
  }
}

export async function listInvoices(
  userId: string,
): Promise<
  Array<{ id: string; date: string; amount: number; status: string; plan: string }>
> {
  try {
    const payments = await db.payment.findMany({
      where: { userId, status: 'SUCCEEDED' },
      orderBy: { createdAt: 'desc' },
      take: 24,
      include: { subscription: { include: { plan: true } } },
    });
    return payments.map((p) => ({
      id: p.id,
      date: p.createdAt.toISOString(),
      amount: p.amount,
      status: p.status,
      plan: p.subscription?.plan?.name ?? '—',
    }));
  } catch {
    return [];
  }
}
