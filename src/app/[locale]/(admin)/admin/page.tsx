import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Users, CreditCard, Activity, Cpu, ShieldAlert, KeyRound } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/navigation';
import { UsageChart } from '@/components/app/usage-chart';
import { ModelBarChart } from '@/components/app/model-bar-chart';
import {
  generateUsageSeries,
  modelDistribution,
  aggregateUsage,
  generateActivity,
} from '@/lib/usage';
import { formatCurrency, formatNumber } from '@/lib/utils';

export default async function AdminOverview({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'admin' });

  const series = generateUsageSeries(30, 17);
  const dist = modelDistribution(13);
  const totals = aggregateUsage(series);
  const recent = generateActivity(8, 19);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-zinc-400">{t('title')}</div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{t('overview')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder={t('searchUsers')} className="bg-zinc-900 border-zinc-800 text-zinc-100 w-72" />
          <Button asChild variant="gradient">
            <Link href="/admin/keys">{t('generateKey')}</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStat label={t('totalUsers')} value="2,418" icon={Users} sub="+126 this month" />
        <AdminStat
          label={t('activeSubs')}
          value="1,392"
          icon={CreditCard}
          sub="92% retention"
        />
        <AdminStat
          label={t('revenue')}
          value={formatCurrency(48_290, 'USD', locale)}
          icon={Activity}
          sub="MRR"
        />
        <AdminStat
          label={t('requests')}
          value={formatNumber(totals.requests, locale)}
          icon={Cpu}
          sub={`avg RPD ${formatNumber(totals.avgRPD, locale)}`}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2 bg-zinc-900/40 border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">{t('requests')} — last 30 days</div>
            <Badge variant="soft" className="bg-zinc-800 text-zinc-200 border-zinc-700">
              system-wide
            </Badge>
          </div>
          <UsageChart data={series} />
        </Card>
        <Card className="p-6 bg-zinc-900/40 border-zinc-800">
          <div className="font-semibold mb-4">{t('topModels')}</div>
          <ModelBarChart data={dist} />
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="p-6 bg-zinc-900/40 border-zinc-800">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="h-4 w-4 text-warning" /> {t('suspicious')}
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              { id: 'usr_2841', sig: 'Token burn 4× baseline', sev: 'HIGH' },
              { id: 'usr_2901', sig: 'Failed auth surge', sev: 'MEDIUM' },
              { id: 'usr_3014', sig: 'Geo anomaly', sev: 'LOW' },
            ].map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 p-3"
              >
                <div>
                  <div className="font-medium">{r.id}</div>
                  <div className="text-xs text-zinc-400">{r.sig}</div>
                </div>
                <Badge variant={r.sev === 'HIGH' ? 'destructive' : 'warning'}>{r.sev}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6 lg:col-span-2 bg-zinc-900/40 border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">Recent activity (system)</div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/logs">All logs →</Link>
            </Button>
          </div>
          <table className="w-full text-sm">
            <thead className="text-zinc-400">
              <tr className="text-left">
                <th className="px-2 py-2 font-medium">Time</th>
                <th className="px-2 py-2 font-medium">User</th>
                <th className="px-2 py-2 font-medium">Model</th>
                <th className="px-2 py-2 font-medium">Tokens</th>
                <th className="px-2 py-2 font-medium">Latency</th>
                <th className="px-2 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((row, i) => (
                <tr key={row.id} className="border-t border-zinc-800">
                  <td className="px-2 py-2 text-zinc-400">
                    {new Date(row.ts).toLocaleTimeString(locale)}
                  </td>
                  <td className="px-2 py-2 font-mono text-xs">usr_{(2000 + i).toString()}</td>
                  <td className="px-2 py-2">{row.model}</td>
                  <td className="px-2 py-2 tabular-nums">{formatNumber(row.tokens, locale)}</td>
                  <td className="px-2 py-2 tabular-nums">{row.latencyMs} ms</td>
                  <td className="px-2 py-2">
                    <Badge variant={row.status === 'ok' ? 'success' : 'destructive'}>
                      {row.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Card className="p-6 bg-zinc-900/40 border-zinc-800">
        <div className="flex items-center gap-2 font-semibold">
          <KeyRound className="h-4 w-4" /> Provider health
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {['CLIProxyAPI Plus', 'OpenAI', 'Anthropic', 'Google'].map((p, i) => (
            <div
              key={p}
              className="rounded-lg border border-zinc-800 p-3 flex items-center justify-between"
            >
              <span>{p}</span>
              <Badge variant={i === 3 ? 'warning' : 'success'}>
                {i === 3 ? 'Degraded' : 'Operational'}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AdminStat({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="p-5 bg-zinc-900/40 border-zinc-800 flex items-start gap-3">
      <div className="rounded-lg bg-zinc-800 p-2 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-zinc-400">{label}</div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
        <div className="mt-0.5 text-xs text-zinc-400">{sub}</div>
      </div>
    </Card>
  );
}
