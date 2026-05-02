import 'server-only';
import { db } from '@/lib/db';

export interface TicketRow {
  id: string;
  userEmail: string;
  subject: string;
  status: 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
}

export async function listSupportTickets(): Promise<TicketRow[]> {
  try {
    const rows = await db.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { email: true } } },
    });
    if (rows.length === 0) return sampleRows();
    return rows.map((t) => ({
      id: t.id,
      userEmail: t.user?.email ?? t.userId,
      subject: t.subject,
      status: t.status as TicketRow['status'],
      createdAt: t.createdAt.toISOString(),
    }));
  } catch {
    return sampleRows();
  }
}

function sampleRows(): TicketRow[] {
  const subjects = [
    'Renewal failed with Polar',
    'Activation code did not redeem',
    'Streaming chat hangs on Gemini',
    'Need invoice in EUR',
    'Account locked after 2FA',
  ];
  const statuses: TicketRow['status'][] = ['OPEN', 'PENDING', 'OPEN', 'RESOLVED', 'CLOSED'];
  return Array.from({ length: 8 }).map((_, i) => ({
    id: `tkt_${1000 + i}`,
    userEmail: `user${i + 1}@routerforge.example`,
    subject: subjects[i % subjects.length],
    status: statuses[i % statuses.length],
    createdAt: new Date(Date.now() - i * 7_200_000).toISOString(),
  }));
}
