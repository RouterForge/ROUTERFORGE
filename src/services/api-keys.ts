'use server';

import 'server-only';
import crypto from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

const KEY_PREFIX = 'rf_live_';

export interface ApiKeyListRow {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  createdAt: string;
  revoked: boolean;
}

function hashKey(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function randomId(length: number): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const buf = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) out += alphabet[buf[i] % alphabet.length];
  return out;
}

export interface CreatedKey extends ApiKeyListRow {
  full: string;
}

export async function listApiKeysForCurrentUser(): Promise<ApiKeyListRow[]> {
  try {
    const user = await requireUser();
    const rows = await db.apiKey.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((k) => ({
      id: k.id,
      name: k.name,
      prefix: k.prefix,
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      createdAt: k.createdAt.toISOString(),
      revoked: Boolean(k.revokedAt),
    }));
  } catch {
    return [];
  }
}

export async function createApiKey(formData: FormData): Promise<CreatedKey | null> {
  'use server';
  const user = await requireUser().catch(() => null);
  if (!user) return null;
  const name = String(formData.get('name') ?? 'New key').slice(0, 120) || 'New key';
  const secret = randomId(28);
  const full = `${KEY_PREFIX}${secret}`;
  const prefix = full.slice(0, 12);

  try {
    const row = await db.apiKey.create({
      data: {
        userId: user.id,
        name,
        prefix,
        hash: hashKey(full),
      },
    });
    revalidatePath('/settings/api-keys');
    return {
      id: row.id,
      name: row.name,
      prefix: row.prefix,
      lastUsedAt: null,
      createdAt: row.createdAt.toISOString(),
      revoked: false,
      full,
    };
  } catch {
    return null;
  }
}

export async function revokeApiKey(formData: FormData): Promise<void> {
  'use server';
  const user = await requireUser().catch(() => null);
  if (!user) return;
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  try {
    await db.apiKey.updateMany({
      where: { id, userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    revalidatePath('/settings/api-keys');
  } catch {
    // ignore
  }
}

/** Resolve an `Authorization: Bearer rf_...` header to a DB ApiKey. */
export async function authenticateApiKey(
  authHeader: string | null,
): Promise<{ userId: string; apiKeyId: string } | null> {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token.startsWith(KEY_PREFIX)) return null;
  try {
    const key = await db.apiKey.findUnique({ where: { hash: hashKey(token) } });
    if (!key || key.revokedAt) return null;
    // Touch lastUsedAt asynchronously (best-effort)
    db.apiKey
      .update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});
    return { userId: key.userId, apiKeyId: key.id };
  } catch {
    return null;
  }
}
