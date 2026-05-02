import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getPlan } from '@/lib/plans';

/**
 * Activation code redemption.
 *
 * Flow:
 *   1. Require an authenticated user.
 *   2. Look up the ActivationCode row by code.
 *   3. Reject if missing, already redeemed, or expired.
 *   4. Create an active Subscription row using the code's plan + durationDays.
 *   5. Mark the code redeemed by this user.
 *
 * Form posts (from /billing) get a 303 redirect to /billing with a status
 * query param. JSON posts get a JSON response.
 */
const schema = z.object({
  code: z.string().min(3).max(64),
});

function wantsJson(req: Request) {
  const ct = req.headers.get('content-type') ?? '';
  return ct.includes('application/json');
}

function back(url: URL, status: 'ok' | 'invalid' | 'used' | 'expired' | 'auth' | 'error') {
  return NextResponse.redirect(new URL(`/billing?redeem=${status}`, url), 303);
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const json = wantsJson(req);

  const user = await getSessionUser().catch(() => null);
  if (!user) {
    return json
      ? NextResponse.json({ error: 'auth' }, { status: 401 })
      : NextResponse.redirect(new URL('/sign-in?next=/billing', url), 303);
  }

  let code: string;
  try {
    if (json) {
      code = schema.parse(await req.json()).code.trim();
    } else {
      const form = await req.formData();
      code = String(form.get('code') ?? '').trim();
      if (!code) throw new Error('missing');
    }
  } catch {
    return json
      ? NextResponse.json({ error: 'missing' }, { status: 400 })
      : back(url, 'invalid');
  }

  try {
    const row = await db.activationCode.findUnique({ where: { code } });
    if (!row) {
      return json ? NextResponse.json({ error: 'invalid' }, { status: 404 }) : back(url, 'invalid');
    }
    if (row.redeemedAt || row.redeemedById) {
      return json ? NextResponse.json({ error: 'used' }, { status: 409 }) : back(url, 'used');
    }
    if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
      return json ? NextResponse.json({ error: 'expired' }, { status: 410 }) : back(url, 'expired');
    }

    const planId = row.planId ?? 'oss';
    const plan = getPlan(planId);
    if (!plan) {
      return json ? NextResponse.json({ error: 'invalid plan' }, { status: 400 }) : back(url, 'invalid');
    }

    const durationDays = row.durationDays ?? 30;
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + durationDays * 86400_000);

    await db.$transaction(async (tx) => {
      // Make sure the Plan row exists locally (seed may not have run).
      await tx.plan.upsert({
        where: { id: plan.id },
        create: {
          id: plan.id,
          name: plan.name,
          tagline: plan.subtitle,
          families: JSON.stringify(plan.families),
          requestsPerDay: 5_000,
          priceDaily: plan.baseMonth / 30,
          priceWeekly: (plan.baseMonth / 30) * 7,
          priceMonthly: plan.baseMonth,
          priceYearly: plan.baseMonth * 12,
          badge: plan.badge ?? null,
        },
        update: {},
      });

      await tx.subscription.create({
        data: {
          userId: user.id,
          planId: plan.id,
          cycle: row.cycle ?? 'monthly',
          status: 'ACTIVE',
          startsAt,
          endsAt,
        },
      });
      await tx.activationCode.update({
        where: { code },
        data: { redeemedById: user.id, redeemedAt: new Date() },
      });
      await tx.adminAuditLog.create({
        data: {
          actorId: user.id,
          action: 'billing.redeem',
          targetType: 'ActivationCode',
          targetId: code,
          metadata: JSON.stringify({ planId: plan.id, durationDays }),
        },
      });
    });

    return json ? NextResponse.json({ ok: true, planId: plan.id, endsAt }) : back(url, 'ok');
  } catch (e) {
    return json
      ? NextResponse.json({ error: 'database', detail: String(e) }, { status: 503 })
      : back(url, 'error');
  }
}
