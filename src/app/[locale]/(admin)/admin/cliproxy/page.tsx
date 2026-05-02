import { setRequestLocale } from 'next-intl/server';
import {
  Zap,
  KeyRound,
  Cpu,
  GitBranch,
  Route,
  FileCog,
  Trash2,
  Plus,
  RefreshCw,
  ShieldAlert,
  Bug,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  Td,
  Th,
  Tr,
} from '@/components/admin/admin-page';
import { OAuthConnectButton } from '@/components/admin/oauth-connect-button';
import { cliproxyAdmin } from '@/services/cliproxy-admin';
import { maskKey } from '@/lib/utils';
import {
  removeAuthFileAction,
  addProxyApiKeyAction,
  removeProxyApiKeyAction,
  addUpstreamKeyAction,
  removeUpstreamKeyAction,
  setRoutingStrategyAction,
  setForceModelPrefixAction,
  toggleDebugAction,
} from './actions';

const OAUTH_PROVIDERS = ['anthropic', 'codex', 'gemini-cli', 'antigravity', 'kimi'] as const;
const UPSTREAM_PROVIDERS = ['gemini', 'claude', 'codex', 'vertex'] as const;
const ROUTING_STRATEGIES = ['round_robin', 'weighted', 'random', 'least_loaded'] as const;

export default async function CliProxyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const info = cliproxyAdmin.info();
  const [health, version, routing, debug, apiKeys, upstreamKeys, authFiles, usage, errorLogs] =
    await Promise.all([
      cliproxyAdmin.health(),
      cliproxyAdmin.latestVersion(),
      cliproxyAdmin.getRouting(),
      cliproxyAdmin.getDebug(),
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
        description="RouterForge's core API layer. Every model request routes through CLIProxyAPI Plus. Add OAuth accounts or direct keys below — changes apply immediately."
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
            <ShieldAlert className="h-4 w-4" /> Upstream not configured
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Set the following in <code className="font-mono">.env</code> and restart the app
            to connect to your CLIProxyAPI Plus instance. Until then this page is read-only.
          </p>
          <pre className="mt-3 rounded-lg bg-muted p-3 text-xs overflow-x-auto">
            <code>{`CLIPROXY_BASE_URL=https://cliproxy.yourdomain.com
CLIPROXY_ADMIN_TOKEN=your-management-password`}</code>
          </pre>
        </AdminCard>
      )}

      {/* Top row: connection + routing + usage */}
      <div className="grid gap-3 md:grid-cols-3">
        <AdminCard className="p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Cpu className="h-4 w-4" /> Instance
          </div>
          <div className="mt-2 font-mono text-sm break-all">
            {info.baseUrl || 'not configured'}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
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
          <form
            action={setRoutingStrategyAction}
            className="mt-2 flex items-center gap-2"
          >
            <Select name="strategy" defaultValue={routing.strategy || 'round_robin'}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROUTING_STRATEGIES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={!info.configured}
            >
              Save
            </Button>
          </form>
          <form
            action={setForceModelPrefixAction}
            className="mt-2 flex items-center gap-2"
          >
            <Input
              name="prefix"
              defaultValue={routing.forceModelPrefix ?? ''}
              placeholder="Force model prefix (optional)"
              className="h-9"
            />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={!info.configured}
            >
              Set
            </Button>
          </form>
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
          <form action={toggleDebugAction} className="mt-3 flex items-center gap-2">
            <input type="hidden" name="enabled" value={debug ? 'false' : 'true'} />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={!info.configured}
              className="gap-1"
            >
              <Bug className="h-4 w-4" /> Debug {debug ? 'on' : 'off'}
            </Button>
          </form>
        </AdminCard>
      </div>

      {/* OAuth accounts — the main feature */}
      <AdminCard className="mt-6 p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <FileCog className="h-4 w-4" /> OAuth accounts
            </div>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
              Connect a provider account with OAuth. Clicking a button opens the provider's
              hosted sign-in in a new tab. When you finish, CLIProxyAPI writes an auth file
              and it appears in the table below.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-1"
          >
            <a href="?refresh=1">
              <RefreshCw className="h-4 w-4" /> Refresh
            </a>
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {OAUTH_PROVIDERS.map((p) => (
            <OAuthConnectButton key={p} provider={p} disabled={!info.configured} />
          ))}
        </div>

        <div className="mt-5">
          {authFiles.length === 0 ? (
            <EmptyState text={info.configured
              ? "No OAuth-backed accounts yet. Click a provider above to connect one."
              : "OAuth accounts will appear here once the CLIProxyAPI instance is configured."
            } />
          ) : (
            <AdminTable
              head={
                <>
                  <Th>Name</Th>
                  <Th>Provider</Th>
                  <Th>Status</Th>
                  <Th>Models</Th>
                  <Th />
                </>
              }
            >
              {authFiles.map((a) => (
                <Tr key={a.fileName}>
                  <Td className="font-medium">{a.name}</Td>
                  <Td>
                    <Badge variant="soft" className="uppercase text-[10px]">
                      {a.provider}
                    </Badge>
                  </Td>
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
                  <Td className="text-end">
                    <form action={removeAuthFileAction}>
                      <input type="hidden" name="name" value={a.name} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" /> Remove
                      </Button>
                    </form>
                  </Td>
                </Tr>
              ))}
            </AdminTable>
          )}
        </div>
      </AdminCard>

      {/* Upstream provider keys */}
      <AdminCard className="mt-6 p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <GitBranch className="h-4 w-4" /> Upstream provider keys
            </div>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
              Direct API keys for Gemini, Claude, Codex, and Vertex. Prefer OAuth above when a
              provider supports it — OAuth refreshes automatically.
            </p>
          </div>
        </div>

        <form
          action={addUpstreamKeyAction}
          className="mt-4 grid gap-2 sm:grid-cols-[140px_1fr_220px_auto]"
        >
          <div className="space-y-1">
            <Label className="text-xs">Provider</Label>
            <Select name="provider" defaultValue="gemini">
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UPSTREAM_PROVIDERS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">API key</Label>
            <Input
              name="key"
              placeholder="sk-... or service-account JSON"
              className="font-mono text-xs"
              required
              disabled={!info.configured}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Label (optional)</Label>
            <Input name="label" placeholder="prod-team" disabled={!info.configured} />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={!info.configured} className="gap-1">
              <Plus className="h-4 w-4" /> Add key
            </Button>
          </div>
        </form>

        <div className="mt-5">
          {upstreamKeys.length === 0 ? (
            <EmptyState text="No upstream keys configured." />
          ) : (
            <AdminTable
              head={
                <>
                  <Th>Name</Th>
                  <Th>Provider</Th>
                  <Th>Key</Th>
                  <Th />
                </>
              }
            >
              {upstreamKeys.map((k) => (
                <Tr key={`${k.provider}-${k.key}`}>
                  <Td>{k.name}</Td>
                  <Td>
                    <Badge variant="soft" className="uppercase text-[10px]">
                      {k.provider}
                    </Badge>
                  </Td>
                  <Td className="font-mono text-xs">{k.masked || maskKey(k.key)}</Td>
                  <Td className="text-end">
                    <form action={removeUpstreamKeyAction}>
                      <input type="hidden" name="provider" value={k.provider} />
                      <input type="hidden" name="key" value={k.key} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </Td>
                </Tr>
              ))}
            </AdminTable>
          )}
        </div>
      </AdminCard>

      {/* Proxy API keys (tokens clients send to CLIProxyAPI) */}
      <AdminCard className="mt-6 p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <KeyRound className="h-4 w-4" /> Proxy API keys
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Tokens that CLIProxyAPI will accept on inbound requests. RouterForge server-side
              code and external clients authenticate with these.
            </p>
          </div>
        </div>

        <form
          action={addProxyApiKeyAction}
          className="mt-4 grid gap-2 sm:grid-cols-[1fr_240px_auto]"
        >
          <div className="space-y-1">
            <Label className="text-xs">Key</Label>
            <Input
              name="key"
              placeholder="sk-routerforge-... (generate any unique string)"
              className="font-mono text-xs"
              required
              disabled={!info.configured}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Label (optional)</Label>
            <Input name="label" placeholder="prod server" disabled={!info.configured} />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={!info.configured} className="gap-1">
              <Plus className="h-4 w-4" /> Add key
            </Button>
          </div>
        </form>

        <div className="mt-5">
          {apiKeys.length === 0 ? (
            <EmptyState text="No proxy API keys configured." />
          ) : (
            <AdminTable
              head={
                <>
                  <Th>Label</Th>
                  <Th>Key</Th>
                  <Th />
                </>
              }
            >
              {apiKeys.map((k) => (
                <Tr key={k.key}>
                  <Td>{k.label ?? '—'}</Td>
                  <Td className="font-mono text-xs">{k.masked || maskKey(k.key)}</Td>
                  <Td className="text-end">
                    <form action={removeProxyApiKeyAction}>
                      <input type="hidden" name="key" value={k.key} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </Td>
                </Tr>
              ))}
            </AdminTable>
          )}
        </div>
      </AdminCard>

      {/* Usage per model / per key */}
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
    <div className="mt-3 rounded-lg border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
