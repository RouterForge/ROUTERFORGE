/**
 * CLIProxyAPI Plus management API client.
 *
 * CLIProxyAPI exposes its management surface under `/v0/management/*` and
 * authenticates requests with the `MANAGEMENT_PASSWORD` env var (sent as a
 * bearer token). See the upstream `internal/api/server.go` for the full route
 * list.
 *
 * This module is the single place that talks to those endpoints. When the
 * base URL is not configured, every method returns sensible mock data so the
 * RouterForge admin UI renders without a backend.
 */
import 'server-only';

const BASE_URL = process.env.CLIPROXY_BASE_URL ?? '';
const ADMIN_TOKEN =
  process.env.CLIPROXY_ADMIN_TOKEN ?? process.env.CLIPROXY_MANAGEMENT_PASSWORD ?? '';
const TIMEOUT = Number(process.env.CLIPROXY_DEFAULT_TIMEOUT_MS ?? 15_000);

function configured() {
  return Boolean(BASE_URL);
}

async function call<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  init?: { body?: unknown; timeoutMs?: number },
): Promise<T> {
  if (!configured()) {
    throw new Error('CLIProxyAPI not configured');
  }
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), init?.timeoutMs ?? TIMEOUT);
  try {
    const res = await fetch(`${BASE_URL}/v0/management${path}`, {
      method,
      signal: controller.signal,
      headers: {
        ...(ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {}),
        ...(init?.body ? { 'content-type': 'application/json' } : {}),
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`CLIProxyAPI ${res.status}: ${text || res.statusText}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(to);
  }
}

/* -----------------------------------------------------------------------
 * Types approximate the CLIProxyAPI management payloads.
 * The upstream responses are not strictly typed; we wrap them here in
 * friendly shapes for the RouterForge admin UI.
 * -------------------------------------------------------------------- */

export interface CliProxyHealth {
  ok: boolean;
  version?: string;
  debug?: boolean;
}

export interface CliProxyApiKey {
  key: string;
  masked: string;
  label?: string;
  createdAt?: string;
}

export interface CliProxyAuthFile {
  name: string;
  provider: string;
  status: 'active' | 'inactive' | 'expired';
  fileName: string;
  models?: string[];
  updatedAt?: string;
}

export interface CliProxyUpstreamKey {
  name: string;
  provider: 'gemini' | 'claude' | 'codex' | 'vertex';
  key: string;
  masked: string;
  status?: string;
}

export interface CliProxyUsageSnapshot {
  totalRequests: number;
  successRate: number;
  perModel: Array<{ model: string; requests: number; tokens: number }>;
  perKey: Array<{ key: string; requests: number; tokens: number }>;
}

export interface CliProxyRouting {
  strategy: 'round_robin' | 'weighted' | 'random' | 'least_loaded' | string;
  forceModelPrefix?: string;
}

function mask(key: string): string {
  if (!key) return '';
  if (key.length <= 12) return key.slice(0, 4) + '…';
  return key.slice(0, 7) + '…' + key.slice(-4);
}

class CliProxyAdmin {
  /** Human-friendly connection info for the admin UI. */
  info() {
    return {
      configured: configured(),
      baseUrl: BASE_URL,
      adminConfigured: Boolean(ADMIN_TOKEN),
    };
  }

  async health(): Promise<CliProxyHealth> {
    if (!configured()) return { ok: false };
    try {
      const res = await fetch(`${BASE_URL}/healthz`, { cache: 'no-store' });
      if (!res.ok) return { ok: false };
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  async latestVersion(): Promise<string | null> {
    try {
      const data = await call<{ version?: string; latest?: string }>('GET', '/latest-version');
      return data.version ?? data.latest ?? null;
    } catch {
      return null;
    }
  }

  /* ----- Config ---------------------------------------------------- */

  async getConfig(): Promise<Record<string, unknown>> {
    try {
      return await call<Record<string, unknown>>('GET', '/config');
    } catch {
      return {};
    }
  }

  async getDebug(): Promise<boolean> {
    try {
      const data = await call<{ debug?: boolean; value?: boolean }>('GET', '/debug');
      return Boolean(data.debug ?? data.value);
    } catch {
      return false;
    }
  }

  async setDebug(enabled: boolean): Promise<void> {
    await call('PUT', '/debug', { body: { debug: enabled } }).catch(() => {});
  }

  /* ----- Routing --------------------------------------------------- */

  async getRouting(): Promise<CliProxyRouting> {
    try {
      const [strategy, prefix] = await Promise.all([
        call<{ strategy?: string }>('GET', '/routing/strategy'),
        call<{ prefix?: string; value?: string }>('GET', '/force-model-prefix'),
      ]);
      return {
        strategy: strategy.strategy ?? 'round_robin',
        forceModelPrefix: prefix.prefix ?? prefix.value ?? undefined,
      };
    } catch {
      return { strategy: 'round_robin' };
    }
  }

  async setRouting(strategy: string): Promise<void> {
    await call('PUT', '/routing/strategy', { body: { strategy } }).catch(() => {});
  }

  /* ----- API keys (proxy-side) ------------------------------------ */

  async listApiKeys(): Promise<CliProxyApiKey[]> {
    try {
      const data = await call<{ keys?: Array<string | { key: string; label?: string }> }>(
        'GET',
        '/api-keys',
      );
      const arr = data.keys ?? [];
      return arr.map((k) =>
        typeof k === 'string'
          ? { key: k, masked: mask(k) }
          : { key: k.key, masked: mask(k.key), label: k.label },
      );
    } catch {
      return [];
    }
  }

  async addApiKey(key: string, label?: string): Promise<void> {
    await call('PATCH', '/api-keys', { body: { key, label } }).catch(() => {});
  }

  async removeApiKey(key: string): Promise<void> {
    await call('DELETE', '/api-keys', { body: { key } }).catch(() => {});
  }

  /* ----- Upstream provider keys ----------------------------------- */

  async listUpstreamKeys(): Promise<CliProxyUpstreamKey[]> {
    const providers = ['gemini', 'claude', 'codex', 'vertex'] as const;
    const out: CliProxyUpstreamKey[] = [];
    for (const p of providers) {
      const path = p === 'vertex' ? '/vertex-api-key' : `/${p}-api-key`;
      try {
        const data = await call<{ keys?: Array<{ name?: string; key: string }> }>(
          'GET',
          path,
        );
        for (const item of data.keys ?? []) {
          const k = typeof item === 'string' ? (item as string) : item.key;
          const name = typeof item === 'string' ? undefined : item.name;
          out.push({
            name: name ?? `${p}-${out.length}`,
            provider: p,
            key: k,
            masked: mask(k),
          });
        }
      } catch {
        // provider endpoint may be missing; skip
      }
    }
    return out;
  }

  /* ----- Auth files (OAuth accounts) ------------------------------ */

  async listAuthFiles(): Promise<CliProxyAuthFile[]> {
    try {
      const data = await call<{ files?: Array<any> }>('GET', '/auth-files');
      return (data.files ?? []).map((f) => ({
        name: f.name ?? f.fileName ?? 'auth',
        provider: f.provider ?? 'unknown',
        status: (f.status ?? 'active') as CliProxyAuthFile['status'],
        fileName: f.fileName ?? f.name ?? '',
        models: f.models,
        updatedAt: f.updatedAt,
      }));
    } catch {
      return [];
    }
  }

  /** Legacy: direct URL to the management auth endpoint (returns JSON). */
  oauthEndpoint(
    provider: 'anthropic' | 'codex' | 'gemini-cli' | 'antigravity' | 'kimi',
  ): string | null {
    if (!configured()) return null;
    const map: Record<string, string> = {
      anthropic: '/v0/management/anthropic-auth-url',
      codex: '/v0/management/codex-auth-url',
      'gemini-cli': '/v0/management/gemini-cli-auth-url',
      antigravity: '/v0/management/antigravity-auth-url',
      kimi: '/v0/management/kimi-auth-url',
    };
    const path = map[provider];
    if (!path) return null;
    return `${BASE_URL}${path}`;
  }

  /**
   * Fetch the provider's hosted OAuth URL from CLIProxyAPI. The admin page
   * opens this URL in a new tab so the super-admin can complete the OAuth
   * flow; when the provider redirects back to CLIProxyAPI, an auth file is
   * written and `listAuthFiles()` will pick it up on the next refresh.
   */
  async startOAuth(
    provider: 'anthropic' | 'codex' | 'gemini-cli' | 'antigravity' | 'kimi',
  ): Promise<string | null> {
    if (!configured()) return null;
    const endpoint = this.oauthEndpoint(provider);
    if (!endpoint) return null;
    try {
      const res = await fetch(endpoint, {
        headers: ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {},
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { url?: string; authUrl?: string };
      return data.url ?? data.authUrl ?? null;
    } catch {
      return null;
    }
  }

  /** Remove an OAuth-backed auth file from CLIProxyAPI. */
  async removeAuthFile(name: string): Promise<boolean> {
    if (!configured()) return false;
    try {
      await call('DELETE', '/auth-files', { body: { name } });
      return true;
    } catch {
      return false;
    }
  }

  /** Add a direct upstream provider key (Gemini / Claude / Codex / Vertex). */
  async addUpstreamKey(
    provider: 'gemini' | 'claude' | 'codex' | 'vertex',
    key: string,
    label?: string,
  ): Promise<boolean> {
    if (!configured()) return false;
    const path = provider === 'vertex' ? '/vertex-api-key' : `/${provider}-api-key`;
    try {
      await call('PATCH', path, { body: { key, name: label } });
      return true;
    } catch {
      return false;
    }
  }

  async removeUpstreamKey(
    provider: 'gemini' | 'claude' | 'codex' | 'vertex',
    key: string,
  ): Promise<boolean> {
    if (!configured()) return false;
    const path = provider === 'vertex' ? '/vertex-api-key' : `/${provider}-api-key`;
    try {
      await call('DELETE', path, { body: { key } });
      return true;
    } catch {
      return false;
    }
  }

  /** Update the forced model prefix (empty string clears it). */
  async setForceModelPrefix(prefix: string): Promise<boolean> {
    if (!configured()) return false;
    try {
      await call('PUT', '/force-model-prefix', { body: { prefix } });
      return true;
    } catch {
      return false;
    }
  }

  /* ----- Usage ----------------------------------------------------- */

  async getUsage(): Promise<CliProxyUsageSnapshot> {
    try {
      const [usage, perKey] = await Promise.all([
        call<any>('GET', '/usage'),
        call<any>('GET', '/api-key-usage'),
      ]);
      return normalizeUsage(usage, perKey);
    } catch {
      return { totalRequests: 0, successRate: 1, perModel: [], perKey: [] };
    }
  }

  /* ----- Logs ------------------------------------------------------ */

  async getRequestErrorLogs(): Promise<Array<{ name: string; size?: number }>> {
    try {
      const data = await call<{ files?: Array<{ name: string; size?: number }> }>(
        'GET',
        '/request-error-logs',
      );
      return data.files ?? [];
    } catch {
      return [];
    }
  }

  /* ----- Provider health ------------------------------------------- */

  async getProviderHealth(): Promise<
    Array<{ id: string; name: string; status: 'operational' | 'degraded' | 'outage' }>
  > {
    if (!configured()) {
      return [
        { id: 'cliproxy', name: 'CLIProxyAPI Plus', status: 'operational' },
        { id: 'openai', name: 'OpenAI', status: 'operational' },
        { id: 'anthropic', name: 'Anthropic', status: 'operational' },
        { id: 'google', name: 'Google Gemini', status: 'operational' },
      ];
    }
    const h = await this.health();
    return [
      {
        id: 'cliproxy',
        name: 'CLIProxyAPI Plus',
        status: h.ok ? 'operational' : 'outage',
      },
    ];
  }
}

function normalizeUsage(usage: any, perKey: any): CliProxyUsageSnapshot {
  const totalRequests = usage?.total_requests ?? usage?.totalRequests ?? 0;
  const successRate = usage?.success_rate ?? usage?.successRate ?? 1;
  const perModelSrc: any[] = usage?.per_model ?? usage?.perModel ?? [];
  const perKeySrc: any[] = perKey?.per_key ?? perKey?.perKey ?? perKey?.keys ?? [];
  return {
    totalRequests,
    successRate,
    perModel: perModelSrc.map((m: any) => ({
      model: m.model ?? m.id ?? 'unknown',
      requests: m.requests ?? m.count ?? 0,
      tokens: m.tokens ?? m.total_tokens ?? 0,
    })),
    perKey: perKeySrc.map((k: any) => ({
      key: k.key ?? k.id ?? '—',
      requests: k.requests ?? k.count ?? 0,
      tokens: k.tokens ?? k.total_tokens ?? 0,
    })),
  };
}

export const cliproxyAdmin = new CliProxyAdmin();
