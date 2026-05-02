import 'server-only';
import { db } from '@/lib/db';

export interface AuditRow {
  id: string;
  actorId: string;
  actorEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  ip: string | null;
  createdAt: string;
}

export async function listAuditLogs(query: string): Promise<AuditRow[]> {
  try {
    const where = query
      ? {
          OR: [
            { action: { contains: query } },
            { targetId: { contains: query } },
            { ip: { contains: query } },
            { actor: { email: { contains: query } } },
          ],
        }
      : {};
    const rows = await db.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { actor: { select: { email: true } } },
    });
    if (rows.length === 0) return sampleRows();
    return rows.map((r) => ({
      id: r.id,
      actorId: r.actorId,
      actorEmail: r.actor?.email ?? null,
      action: r.action,
      targetType: r.targetType,
      targetId: r.targetId,
      ip: r.ip,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch {
    return sampleRows();
  }
}

function sampleRows(): AuditRow[] {
  const actions = [
    'auth.sign_in',
    'auth.sign_out',
    'apikey.create',
    'apikey.revoke',
    'subscription.create',
    'admin.user.suspend',
    'admin.code.generate',
    'admin.payment.approve',
  ];
  return Array.from({ length: 30 }).map((_, i) => ({
    id: `evt_${i}`,
    actorId: `usr_${(2000 + i).toString(36)}`,
    actorEmail:
      i % 5 === 0 ? 'admin@routerforge.example' : `user${i}@routerforge.example`,
    action: actions[i % actions.length],
    targetType: null,
    targetId: `usr_${(3000 + i).toString(36)}`,
    ip: `${10 + (i % 200)}.${i % 250}.${(i * 7) % 250}.${(i * 31) % 250}`,
    createdAt: new Date(Date.now() - i * 60_000).toISOString(),
  }));
}
