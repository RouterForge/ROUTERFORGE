import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Users, CreditCard, Activity, Cpu, ShieldAlert, KeyRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/navigation';
import { StatCard } from '@/components/app/stat-card';
import { UsageChart } from '@/components/app/usage-chart';
import { ModelBarChart } from '@/components/app/model-bar-chart';
import {
  AdminPageHeader,
  AdminCard,
  AdminTable,
  Th,
  Td,
  Tr,
} from '@/components/admin/admin-page';
import { getAdminOverview } from '@/services/admin';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';

export default async function AdminOverview({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'admin' });
  const o = await getAdminOverview();

  return (
    <div>
      <AdminPageHeader
        title={t('overview')}
        description="System-wide revenue, usage, abuse signals, and provider health."
        actions={
          <>
            <Input placeholder={t('searchUsers')} className="w-72" />
            <Button asChild variant="gradient">
              <Link href="/admin/keys">{t('generateKey')}</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('totalUsers')}
          value={formatNumber(o.totals.users, locale)}
          icon={Users}
          sub={`+${o.totals.newUsers30d} this month`}
          trend={{ value: '+8%', direction: 'up' }}
        />
        <StatCard
          label={t('activeSubs')}
          value={formatNumber(o.totals.activeSubs, locale)}
          icon={CreditCard}
          sub={`${o.totals.retentionPct}% retention`}
          trend={{ value: '+3%', direction: 'up' }}
        />
        <StatCard
          label={t('revenue')}
          value={formatCurrency(o.totals.mrr, 'USD', locale)}
          icon={Activity}
          sub="MRR"
          trend={{ value: '+12%', direction: 'up' }}
        />
        <StatCard
          label={t('requests')}
          value={formatNumber(o.usage.requests, locale)}
          icon={Cpu}
          sub={`avg RPD ${formatNumber(o.usage.avgRPD, locale)}`}
        />
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        <AdminCard className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">{t('requests')} — last 30 days</div>
            <Badge variant="soft">system-wide</Badge>
          </div>
          <UsageChart data={o.series} />
        </AdminCard>
        <AdminCard className="p-6">
          <div className="font-semibold mb-4">{t('topModels')}</div>
          <ModelBarChart data={o.topModels} />
        </AdminCard>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        <AdminCard className="p-6">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="h-4 w-4 text-warning" /> {t('suspicious')}
          </div>
          {o.suspicious.length === 0 ? (
            <div className="mt-3 rounded-lg border border-success/40 bg-success/5 p-3 text-sm text-success">
              No open flags. Good signal.
            </div>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {o.suspicious.slice(0, 4).map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 p-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{r.userEmail}</div>
                    <div className="text-xs text-muted-foreground truncate">{r.reason}</div>
                  </div>
                  <Badge
                    variant={
                      r.severity === 'CRITICAL' || r.severity === 'HIGH'
                        ? 'destructive'
                        : r.severity === 'MEDIUM'
                          ? 'warning'
                          : 'soft'
                    }
                  >
                    {r.severity}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <Button asChild variant="ghost" size="sm" className="mt-2 w-full">
            <Link href="/admin/abuse">View all →</Link>
          </Button>
        </AdminCard>

        <AdminCard className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">Recent activity</div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/logs">All logs →</Link>
            </Button>
          </div>
          <AdminTable
            head={
              <>
                <Th>Time</Th>
                <Th>User</Th>
                <Th>Model</Th>
                <Th>Tokens</Th>
                <Th>Latency</Th>
                <Th>Status</Th>
              </>
            }
          >
            {o.recentEvents.map((row) => (
              <Tr key={row.id}>
                <Td className="text-muted-foreground">
                  {formatDate(row.createdAt, locale, {
                    dateStyle: 'short',
                    timeStyle: 'medium',
                  } as any)}
                </Td>
                <Td className="font-mono text-xs">{row.userEmail ?? row.userId}</Td>
                <Td>{row.modelId}</Td>
                <Td className="tabular-nums">
                  {formatNumber(row.inputTokens + row.outputTokens, locale)}
                </Td>
                <Td className="tabular-nums">{row.latencyMs} ms</Td>
                <Td>
                  <Badge variant={row.success ? 'success' : 'destructive'}>
                    {row.success ? 'ok' : 'fail'}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </AdminTable>
        </AdminCard>
      </div>

      <AdminCard className="mt-6 p-6">
        <div className="flex items-center gap-2 font-semibold">
          <KeyRound className="h-4 w-4" /> Provider health
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {o.providers.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-border/60 bg-card p-3 flex items-center justify-between"
            >
              <span>{p.name}</span>
              <Badge variant={p.status === 'operational' ? 'success' : 'warning'}>
                {p.status}
              </Badge>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
