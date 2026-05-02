import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

/**
 * Cancel the user's currently active subscription.
 *
 * "Cancel" here means "do not auto-renew" — the subscription stays ACTIVE
 * until its `endsAt` date. After that date the dashboard treats it as
 * expired automatically.
 */
export async function POST(req: Request) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: 'auth' }, { status: 401 });

  try {
    const sub = await db.subscription.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
      orderBy: { startsAt: 'desc' },
    });
    if (!sub) {
      return NextResponse.json({ ok: true, cancelled: null });
    }
    await db.subscription.update({
      where: { id: sub.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
    await db.adminAuditLog.create({
      data: {
        actorId: user.id,
        action: 'billing.cancel',
        targetType: 'Subscription',
        targetId: sub.id,
      },
    });
    if (req.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ ok: true, cancelled: sub.id });
    }
    return NextResponse.redirect(new URL('/billing?cancel=ok', req.url), 303);
  } catch (e) {
    return NextResponse.json({ error: 'database', detail: String(e) }, { status: 503 });
  }
}
