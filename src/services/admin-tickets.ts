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
    if (rows.length === 0) return [];
    return rows.map((t) => ({
      id: t.id,
      userEmail: t.user?.email ?? t.userId,
      subject: t.subject,
      status: t.status as TicketRow['status'],
      createdAt: t.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}
