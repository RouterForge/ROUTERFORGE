import { setRequestLocale, getTranslations } from 'next-intl/server';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Coins,
  Cpu,
  Download,
  KeyRound,
  Sparkles,
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link } from '@/i18n/navigation';
import { StatCard } from '@/components/app/stat-card';
import { UsageChart } from '@/components/app/usage-chart';
import { ModelBarChart } from '@/components/app/model-bar-chart';
import { getDashboardData } from '@/services/dashboard';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import { requireUser } from '@/lib/auth';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'dashboard' });

  const user = await requireUser();
  const data = await getDashboardData(user.id);

  const planCost = 49;
  const savings = Math.max(0, data.directCost - planCost);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {t('title')}
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {t('welcome', { name: user.name ?? user.email })}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" /> {t('exportCsv')}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" /> {t('exportJson')}
          </Button>
          <Button asChild variant="gradient" size="sm">
            <Link href="/playground">
              <Sparkles className="h-4 w-4" /> Open Playground
            </Link>
          </Button>
        </div>
      </div>

      {!data.hasRealData && (
        <Card className="p-4 border-primary/30 bg-primary/5 text-sm">
          <span className="font-medium text-primary">Sample data</span>
          <span className="text-muted-foreground">
            {' '}
            — your account has no usage events yet. Create an API key in Settings, then hit{' '}
            <code className="font-mono">/v1/chat/completions</code> to see real numbers here.
          </span>
        </Card>
      )}

      {/* Subscription status */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {t('currentPlan')}
            </div>
            <div className="mt-1 text-xl font-semibold">
              {data.subscription.planName}
              {data.subscription.cycle !== '—' && ` · ${capitalize(data.subscription.cycle)}`}
            </div>
            {data.subscription.endsAt ? (
              <div className="mt-1 text-sm text-muted-foreground">
                {t('endsOn', { date: formatDate(data.subscription.endsAt, locale) })}
              </div>
            ) : (
              <div className="mt-1 text-sm text-muted-foreground">
                No active subscription. Pick a plan to unlock the API.
              </div>
            )}
          </div>
          <div className="md:max-w-xs w-full">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t('timeRemaining')}</span>
              <span>{data.subscription.cycleProgressPct}%</span>
            </div>
            <Progress value={data.subscription.cycleProgressPct} className="mt-2" />
            <div className="mt-3 flex gap-2 justify-end">
              <Button asChild size="sm" variant="outline">
                <Link href="/billing">Manage</Link>
              </Button>
              <Button asChild size="sm" variant="gradient">
                <Link href="/pricing">
                  {data.subscription.status === 'NONE' ? 'Choose plan' : 'Upgrade'}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('requests')}
          value={formatNumber(data.totals.requests, locale)}
          sub="last 30 days"
          icon={Activity}
          trend={{ value: '+8.4%', direction: 'up' }}
        />
        <StatCard
          label={t('tokens')}
          value={formatNumber(data.totals.inputTokens + data.totals.outputTokens, locale)}
          sub={`${formatNumber(data.totals.inputTokens, locale)} in / ${formatNumber(
            data.totals.outputTokens,
            locale,
          )} out`}
          icon={Cpu}
          trend={{ value: '+5.1%', direction: 'up' }}
        />
        <StatCard
          label={t('rpm')}
          value={`${data.totals.avgRPM} / min`}
          sub={`avg RPD ${formatNumber(data.totals.avgRPD, locale)}`}
          icon={KeyRound}
          trend={{ value: '−1.2%', direction: 'down' }}
        />
        <StatCard
          label={t('savingsTitle')}
          value={formatCurrency(savings, 'USD', locale)}
          sub={t('savingsSubtitle')}
          icon={Coins}
          trend={{
            value: `vs ${formatCurrency(data.directCost, 'USD', locale)}`,
            direction: 'up',
          }}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">{t('requestsOverTime')}</div>
            <Badge variant="soft">last 30 days</Badge>
          </div>
          <UsageChart data={data.series} />
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">{t('modelDistribution')}</div>
          </div>
          <ModelBarChart data={data.topModels} />
        </Card>
      </div>

      {/* Alerts + recent activity */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="p-6">
          <div className="font-semibold">{t('usageAlerts')}</div>
          <div className="mt-3 rounded-lg border border-success/40 bg-success/5 p-3 text-sm text-success">
            {t('noAlerts')}
          </div>
          <div className="mt-2 rounded-lg border border-border/60 p-3 text-sm">
            <div className="flex items-center gap-2">
              <ArrowUp className="h-4 w-4 text-warning" />
              <span className="font-medium">Spike detection</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              We'll notify you if requests suddenly exceed 2× your baseline.
            </div>
          </div>
          <div className="mt-2 rounded-lg border border-border/60 p-3 text-sm">
            <div className="flex items-center gap-2">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Smart routing enabled</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Requests automatically fall back across providers on upstream errors.
            </div>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">{t('recentActivity')}</div>
          </div>
          <div className="overflow-x-auto -mx-2">
            <table className="min-w-full text-sm">
              <thead className="text-muted-foreground">
                <tr className="text-left">
                  <th className="px-2 py-2 font-medium">Time</th>
                  <th className="px-2 py-2 font-medium">Model</th>
                  <th className="px-2 py-2 font-medium">Endpoint</th>
                  <th className="px-2 py-2 font-medium">Tokens</th>
                  <th className="px-2 py-2 font-medium">Latency</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.activity.map((row) => (
                  <tr key={row.id} className="border-t border-border/60">
                    <td className="px-2 py-2 text-muted-foreground">
                      {new Date(row.ts).toLocaleTimeString(locale)}
                    </td>
                    <td className="px-2 py-2 font-medium">{row.model}</td>
                    <td className="px-2 py-2 text-muted-foreground">{row.endpoint}</td>
                    <td className="px-2 py-2 tabular-nums">
                      {formatNumber(row.tokens, locale)}
                    </td>
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
          </div>
        </Card>
      </div>
    </div>
  );
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
