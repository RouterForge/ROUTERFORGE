import 'server-only';
import { db } from '@/lib/db';

export interface AdminPaymentRow {
  id: string;
  userEmail: string;
  provider: string;
  amount: number;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' | 'MANUAL_REVIEW';
  createdAt: string;
}

export async function listAdminPayments(): Promise<AdminPaymentRow[]> {
  try {
    const rows = await db.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { email: true } } },
    });
    if (rows.length === 0) return [];
    return rows.map((p) => ({
      id: p.id,
      userEmail: p.user.email,
      provider: p.provider,
      amount: p.amount,
      status: p.status as AdminPaymentRow['status'],
      createdAt: p.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}
