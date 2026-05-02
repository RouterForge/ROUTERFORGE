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
    if (rows.length === 0) return [];
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
    return [];
  }
}
