import 'server-only';
import { db } from '@/lib/db';

export interface AbuseRow {
  id: string;
  userEmail: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
  resolved: boolean;
  createdAt: string;
}

export async function listAbuseFlags(): Promise<AbuseRow[]> {
  try {
    const rows = await db.abuseFlag.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { email: true } } },
    });
    if (rows.length === 0) return [];
    return rows.map((r) => ({
      id: r.id,
      userEmail: r.user?.email ?? r.userId,
      severity: r.severity as AbuseRow['severity'],
      reason: r.reason,
      resolved: r.resolved,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}
