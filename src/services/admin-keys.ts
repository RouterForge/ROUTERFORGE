'use server';

import 'server-only';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';

export interface ActivationCodeRow {
  code: string;
  planId: string | null;
  cycle: string | null;
  durationDays: number | null;
  redeemed: boolean;
  createdAt: string;
  expiresAt: string | null;
  issuedBy: string | null;
}

export async function listActivationCodes(): Promise<ActivationCodeRow[]> {
  try {
    const rows = await db.activationCode.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { createdBy: { select: { email: true } } },
    });
    return rows.map((c) => ({
      code: c.code,
      planId: c.planId,
      cycle: c.cycle,
      durationDays: c.durationDays,
      redeemed: Boolean(c.redeemedAt),
      createdAt: c.createdAt.toISOString(),
      expiresAt: c.expiresAt?.toISOString() ?? null,
      issuedBy: c.createdBy?.email ?? null,
    }));
  } catch {
    return [];
  }
}

function randomCode() {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RF-${part()}-${part()}-${part()}`;
}

export async function createActivationCodes(formData: FormData) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return;

  const planId = String(formData.get('planId') ?? 'gpt');
  const cycle = String(formData.get('cycle') ?? 'monthly');
  const durationDays = Math.max(1, Number(formData.get('durationDays') ?? 30));
  const quantity = Math.min(1000, Math.max(1, Number(formData.get('quantity') ?? 10)));
  const note = (formData.get('note') as string) || null;

  const items = Array.from({ length: quantity }).map(() => ({
    code: randomCode(),
    planId,
    cycle,
    durationDays,
    note,
    createdById: admin.id,
    expiresAt: new Date(Date.now() + 365 * 86400_000),
  }));

  try {
    await db.activationCode.createMany({ data: items });
    await db.adminAuditLog.create({
      data: {
        actorId: admin.id,
        action: 'admin.code.generate',
        targetType: 'ActivationCode',
        metadata: JSON.stringify({ planId, cycle, durationDays, quantity }),
      },
    });
  } catch {
    // ignore in dev — DB may not be pushed yet
  }
  revalidatePath('/admin/keys');
}
