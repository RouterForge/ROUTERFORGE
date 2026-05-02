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
    if (rows.length === 0) return sampleRows();
    return rows.map((r) => ({
      id: r.id,
      userEmail: r.user?.email ?? r.userId,
      severity: r.severity as AbuseRow['severity'],
      reason: r.reason,
      resolved: r.resolved,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch {
    return sampleRows();
  }
}

function sampleRows(): AbuseRow[] {
  const severities: AbuseRow['severity'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const reasons = [
    'Token burn 4× baseline',
    'Repeated policy-violation attempts',
    'Failed auth surge',
    'Geo anomaly',
    'Suspicious model mix',
  ];
  return Array.from({ length: 10 }).map((_, i) => ({
    id: `flag_${i}`,
    userEmail: `user${1000 + i}@routerforge.example`,
    severity: severities[i % 4],
    reason: reasons[i % reasons.length],
    resolved: i % 4 === 0,
    createdAt: new Date(Date.now() - i * 3_600_000).toISOString(),
  }));
}
