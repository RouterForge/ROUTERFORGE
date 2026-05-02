import { setRequestLocale } from 'next-intl/server';
import { Zap, KeyRound, Cpu, GitBranch, Route, FileCog } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  Td,
  Th,
  Tr,
} from '@/components/admin/admin-page';
import { cliproxyAdmin } from '@/services/cliproxy-admin';
import { maskKey } from '@/lib/utils';

export default async function CliProxyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const info = cliproxyAdmin.info();
  const [health, version, routing, apiKeys, upstreamKeys, authFiles, usage, errorLogs] =
    await Promise.all([
      cliproxyAdmin.health(),
      cliproxyAdmin.latestVersion(),
      cliproxyAdmin.getRouting(),
      cliproxyAdmin.listApiKeys(),
      cliproxyAdmin.listUpstreamKeys(),
      cliproxyAdmin.listAuthFiles(),
      cliproxyAdmin.getUsage(),
      cliproxyAdmin.getRequestErrorLogs(),
    ]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Admin · Upstream"
        title="CLIProxyAPI Plus"
        description="Manage the proxy layer: routing, upstream accounts, API keys, and usage. Requests to RouterForge models ultimately go through this router."
        actions={
          <Badge variant={health.ok ? 'success' : info.configured ? 'destructive' : 'soft'}>
            {info.configured
              ? health.ok
                ? 'Connected'
                : 'Unreachable'
              : 'Not configured'}
          </Badge>
        }
      />

      {!info.configured && (
        <AdminCard className="p-6 mb-6 border-warning/40 bg-warning/5">
          <div className="font-semibold text-warning flex items-center gap-2">
            <Zap className="h-4 w-4" /> Upstream not configured
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Set <code className="font-mono">CLIPROXY_BASE_URL</code> and{' '}
            <code className="font-mono">CLIPROXY_ADMIN_TOKEN</code> in <code>.env</code> to
            connect RouterForge to your CLIProxyAPI Plus instance. Until then, admin metrics
            shown here are placeholders.
          </p>
        </AdminCard>
      )}

      {/* Top row: connection + routing */}
      <div className="grid gap-3 md:grid-cols-3">
        <AdminCard className="p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Cpu className="h-4 w-4" /> Instance
          </div>
          <div className="mt-2 font-mono text-sm break-all">
            {info.baseUrl || 'not configured'}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <Badge variant={info.adminConfigured ? 'success' : 'warning'}>
              {info.adminConfigured ? 'Admin token set' : 'Admin token missing'}
            </Badge>
            {version && <Badge variant="soft">v{version}</Badge>}
          </div>
        </AdminCard>

        <AdminCard className="p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Route className="h-4 w-4" /> Routing
          </div>
          <div className="mt-2 text-lg font-semibold capitalize">
            {routing.strategy.replace(/_/g, ' ')}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Force prefix: <span className="font-mono">{routing.forceModelPrefix || '—'}</span>
          </div>
        </AdminCard>

        <AdminCard className="p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4" /> Usage snapshot
          </div>
          <div className="mt-2 text-lg font-semibold tabular-nums">
            {usage.totalRequests.toLocaleString(locale)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            success rate {(usage.successRate * 100).toFixed(1)}%
          </div>
        </AdminCard>
      </div>

      {/* API keys (proxy auth tokens) */}
      <AdminCard className="mt-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <KeyRound className="h-4 w-4" /> Proxy API keys
          </div>
          <div className="text-xs text-muted-foreground">
            Keys accepted by CLIProxyAPI for inference calls.
          </div>
        </div>
        <div className="mt-3">
          {apiKeys.length === 0 ? (
            <EmptyState text="No proxy API keys configured." />
          ) : (
            <AdminTable
              head={
                <>
                  <Th>Label</Th>
                  <Th>Key</Th>
                </>
              }
            >
              {apiKeys.map((k) => (
                <Tr key={k.key}>
                  <Td>{k.label ?? '—'}</Td>
                  <Td className="font-mono text-xs">{k.masked || maskKey(k.key)}</Td>
                </Tr>
              ))}
            </AdminTable>
          )}
        </div>
      </AdminCard>

      {/* Upstream provider keys */}
      <AdminCard className="mt-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <GitBranch className="h-4 w-4" /> Upstream provider keys
          </div>
          <div className="text-xs text-muted-foreground">
            Direct keys to Gemini, Claude, Codex, and Vertex endpoints.
          </div>
        </div>
        <div className="mt-3">
          {upstreamKeys.length === 0 ? (
            <EmptyState text="No upstream keys configured." />
          ) : (
            <AdminTable
              head={
                <>
                  <Th>Name</Th>
                  <Th>Provider</Th>
                  <Th>Key</Th>
                </>
              }
            >
              {upstreamKeys.map((k) => (
                <Tr key={`${k.provider}-${k.key}`}>
                  <Td>{k.name}</Td>
                  <Td>
                    <Badge variant="soft" className="uppercase">
                      {k.provider}
                    </Badge>
                  </Td>
                  <Td className="font-mono text-xs">{k.masked}</Td>
                </Tr>
              ))}
            </AdminTable>
          )}
        </div>
      </AdminCard>

      {/* OAuth auth files */}
      <AdminCard className="mt-6 p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 font-semibold">
            <FileCog className="h-4 w-4" /> OAuth accounts (auth files)
          </div>
          <div className="flex flex-wrap gap-1">
            {(['anthropic', 'codex', 'gemini-cli', 'antigravity', 'kimi'] as const).map(
              (p) => {
                const url = cliproxyAdmin.oauthUrl(p);
                return (
                  <Button
                    key={p}
                    asChild={!!url}
                    variant="outline"
                    size="sm"
                    disabled={!url}
                  >
                    {url ? (
                      <a href={url} target="_blank" rel="noreferrer">
                        + {p}
                      </a>
                    ) : (
                      <span>+ {p}</span>
                    )}
                  </Button>
                );
              },
            )}
          </div>
        </div>
        <div className="mt-3">
          {authFiles.length === 0 ? (
            <EmptyState text="No OAuth-backed accounts registered yet." />
          ) : (
            <AdminTable
              head={
                <>
                  <Th>Name</Th>
                  <Th>Provider</Th>
                  <Th>Status</Th>
                  <Th>Models</Th>
                </>
              }
            >
              {authFiles.map((a) => (
                <Tr key={a.fileName}>
                  <Td className="font-medium">{a.name}</Td>
                  <Td>{a.provider}</Td>
                  <Td>
                    <Badge
                      variant={
                        a.status === 'active'
                          ? 'success'
                          : a.status === 'expired'
                            ? 'destructive'
                            : 'warning'
                      }
                    >
                      {a.status}
                    </Badge>
                  </Td>
                  <Td className="text-muted-foreground text-xs">
                    {a.models?.slice(0, 4).join(', ') || '—'}
                  </Td>
                </Tr>
              ))}
            </AdminTable>
          )}
        </div>
      </AdminCard>

      {/* Usage per model */}
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <AdminCard className="p-6">
          <div className="font-semibold">Usage per model</div>
          {usage.perModel.length === 0 ? (
            <EmptyState text="Usage will appear once requests start flowing." />
          ) : (
            <AdminTable
              head={
                <>
                  <Th>Model</Th>
                  <Th>Requests</Th>
                  <Th>Tokens</Th>
                </>
              }
            >
              {usage.perModel.map((m) => (
                <Tr key={m.model}>
                  <Td>{m.model}</Td>
                  <Td className="tabular-nums">{m.requests.toLocaleString(locale)}</Td>
                  <Td className="tabular-nums">{m.tokens.toLocaleString(locale)}</Td>
                </Tr>
              ))}
            </AdminTable>
          )}
        </AdminCard>

        <AdminCard className="p-6">
          <div className="font-semibold">Usage per key</div>
          {usage.perKey.length === 0 ? (
            <EmptyState text="No per-key usage reported yet." />
          ) : (
            <AdminTable
              head={
                <>
                  <Th>Key</Th>
                  <Th>Requests</Th>
                  <Th>Tokens</Th>
                </>
              }
            >
              {usage.perKey.map((k) => (
                <Tr key={k.key}>
                  <Td className="font-mono text-xs">{maskKey(k.key)}</Td>
                  <Td className="tabular-nums">{k.requests.toLocaleString(locale)}</Td>
                  <Td className="tabular-nums">{k.tokens.toLocaleString(locale)}</Td>
                </Tr>
              ))}
            </AdminTable>
          )}
        </AdminCard>
      </div>

      {/* Error logs */}
      <AdminCard className="mt-6 p-6">
        <div className="font-semibold">Request error logs</div>
        {errorLogs.length === 0 ? (
          <EmptyState text="No error logs recorded." />
        ) : (
          <ul className="mt-3 space-y-1 text-sm font-mono">
            {errorLogs.slice(0, 10).map((f) => (
              <li key={f.name} className="flex items-center justify-between">
                <span>{f.name}</span>
                {typeof f.size === 'number' && (
                  <span className="text-muted-foreground text-xs">
                    {(f.size / 1024).toFixed(1)} KB
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-3 rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
