'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { cliproxyAdmin } from '@/services/cliproxy-admin';
import { db } from '@/lib/db';

/**
 * Server actions for the Admin → CLIProxyAPI page.
 *
 * Every mutation:
 *   1. Requires an authenticated SUPER_ADMIN / ADMIN.
 *   2. Delegates to the cliproxy-admin service which talks to the real
 *      CLIProxyAPI Plus management endpoints (`/v0/management/*`).
 *   3. Writes an AdminAuditLog row so the action is traceable.
 *   4. Revalidates `/admin/cliproxy` so the UI reflects the change.
 */

type OAuthProvider = 'anthropic' | 'codex' | 'gemini-cli' | 'antigravity' | 'kimi';
type UpstreamProvider = 'gemini' | 'claude' | 'codex' | 'vertex';

async function audit(
  actorId: string,
  action: string,
  metadata?: Record<string, unknown>,
  targetType?: string,
  targetId?: string,
) {
  try {
    await db.adminAuditLog.create({
      data: {
        actorId,
        action,
        targetType: targetType ?? null,
        targetId: targetId ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch {
    // DB optional in dev
  }
}

/**
 * Fetch the provider's OAuth URL from CLIProxyAPI. The admin page then opens
 * the URL in a new window so the super-admin can complete the flow.
 */
export async function startOAuthAction(
  provider: OAuthProvider,
): Promise<{ url: string | null; error?: string }> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { url: null, error: 'Not authorized' };

  const url = await cliproxyAdmin.startOAuth(provider);
  await audit(admin.id, 'cliproxy.oauth.start', { provider, ok: Boolean(url) });
  if (!url) {
    return {
      url: null,
      error:
        'CLIProxyAPI did not return an auth URL. Check CLIPROXY_BASE_URL and CLIPROXY_ADMIN_TOKEN.',
    };
  }
  return { url };
}

export async function removeAuthFileAction(formData: FormData) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return;
  const name = String(formData.get('name') ?? '');
  if (!name) return;
  const ok = await cliproxyAdmin.removeAuthFile(name);
  await audit(admin.id, 'cliproxy.oauth.remove', { name, ok }, 'CliProxyAuthFile', name);
  revalidatePath('/admin/cliproxy');
}

export async function addProxyApiKeyAction(formData: FormData) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return;
  const key = String(formData.get('key') ?? '').trim();
  const label = String(formData.get('label') ?? '').trim() || undefined;
  if (!key) return;
  await cliproxyAdmin.addApiKey(key, label);
  await audit(admin.id, 'cliproxy.apikey.add', { label });
  revalidatePath('/admin/cliproxy');
}

export async function removeProxyApiKeyAction(formData: FormData) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return;
  const key = String(formData.get('key') ?? '');
  if (!key) return;
  await cliproxyAdmin.removeApiKey(key);
  await audit(admin.id, 'cliproxy.apikey.remove');
  revalidatePath('/admin/cliproxy');
}

export async function addUpstreamKeyAction(formData: FormData) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return;
  const provider = String(formData.get('provider') ?? '') as UpstreamProvider;
  const key = String(formData.get('key') ?? '').trim();
  const label = String(formData.get('label') ?? '').trim() || undefined;
  if (!provider || !key) return;
  await cliproxyAdmin.addUpstreamKey(provider, key, label);
  await audit(admin.id, 'cliproxy.upstream.add', { provider, label });
  revalidatePath('/admin/cliproxy');
}

export async function removeUpstreamKeyAction(formData: FormData) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return;
  const provider = String(formData.get('provider') ?? '') as UpstreamProvider;
  const key = String(formData.get('key') ?? '');
  if (!provider || !key) return;
  await cliproxyAdmin.removeUpstreamKey(provider, key);
  await audit(admin.id, 'cliproxy.upstream.remove', { provider });
  revalidatePath('/admin/cliproxy');
}

export async function setRoutingStrategyAction(formData: FormData) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return;
  const strategy = String(formData.get('strategy') ?? '');
  if (!strategy) return;
  await cliproxyAdmin.setRouting(strategy);
  await audit(admin.id, 'cliproxy.routing.set', { strategy });
  revalidatePath('/admin/cliproxy');
}

export async function setForceModelPrefixAction(formData: FormData) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return;
  const prefix = String(formData.get('prefix') ?? '').trim();
  await cliproxyAdmin.setForceModelPrefix(prefix);
  await audit(admin.id, 'cliproxy.routing.prefix', { prefix });
  revalidatePath('/admin/cliproxy');
}

export async function toggleDebugAction(formData: FormData) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return;
  const enabled = String(formData.get('enabled') ?? 'false') === 'true';
  await cliproxyAdmin.setDebug(enabled);
  await audit(admin.id, 'cliproxy.debug.toggle', { enabled });
  revalidatePath('/admin/cliproxy');
}
