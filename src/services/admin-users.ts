import 'server-only';
import { db } from '@/lib/db';

export interface AdminUserRow {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  plan: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PAUSED' | 'CANCELLED' | 'NONE';
  requests30d: number;
  createdAt: string;
}

export async function listAdminUsers(query: string): Promise<AdminUserRow[]> {
  try {
    const where = query
      ? {
          OR: [
            { email: { contains: query } },
            { id: { contains: query } },
            { name: { contains: query } },
          ],
        }
      : {};

    const users = await db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        subscriptions: {
          orderBy: { startsAt: 'desc' },
          take: 1,
          include: { plan: true },
        },
      },
    });

    if (users.length === 0) return [];

    const since = new Date(Date.now() - 30 * 86400_000);
    const usage = await db.usageEvent.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: since }, userId: { in: users.map((u) => u.id) } },
      _count: { _all: true },
    });
    const usageMap = new Map(usage.map((u) => [u.userId, u._count._all]));

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role as AdminUserRow['role'],
      plan: u.subscriptions[0]?.plan?.name ?? '—',
      status: (u.subscriptions[0]?.status ?? 'NONE') as AdminUserRow['status'],
      requests30d: usageMap.get(u.id) ?? 0,
      createdAt: u.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}
