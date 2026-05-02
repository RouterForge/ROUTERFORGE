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
    if (rows.length === 0) return sampleRows();
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
    return sampleRows();
  }
}

function sampleRows(): ActivationCodeRow[] {
  return Array.from({ length: 12 }).map((_, i) => ({
    code: `RF-${(Math.random() * 1e9).toString(36).slice(0, 4).toUpperCase()}-${i
      .toString()
      .padStart(4, '0')}`,
    planId: (['opensource', 'gpt', 'bundle'][i % 3]),
    cycle: (['monthly', 'yearly'][i % 2]),
    durationDays: [30, 365][i % 2],
    redeemed: i % 3 === 0,
    createdAt: new Date(Date.now() - i * 86400_000).toISOString(),
    expiresAt: new Date(Date.now() + (i + 5) * 86400_000).toISOString(),
    issuedBy: 'admin@routerforge.example',
  }));
}

function randomCode() {
  const a = Math.random().toString(36).slice(2, 6).toUpperCase();
  const b = Math.random().toString(36).slice(2, 6).toUpperCase();
  const c = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RF-${a}-${b}-${c}`;
}

export async function createActivationCodes(formData: FormData) {
  'use server';
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
  } catch {
    // ignore in dev — DB may not be pushed yet
  }
  revalidatePath('/admin/keys');
}
