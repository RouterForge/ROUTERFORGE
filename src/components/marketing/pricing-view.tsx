'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  Check,
  Gauge,
  Target,
  Coins,
  CreditCard,
  Bitcoin,
  CircleDollarSign,
  Wallet,
} from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PLANS,
  PAYMENT_METHODS,
  savingsVsMonthly,
  type BillingCycle,
} from '@/lib/plans';
import { MODEL_FAMILIES, MODELS } from '@/lib/models';
import { cn, formatCurrency } from '@/lib/utils';

const routingPresets = [
  { id: 'fastest', icon: Gauge, titleKey: 'routing.fastest' },
  { id: 'bestReasoning', icon: Target, titleKey: 'routing.bestReasoning' },
  { id: 'bestValue', icon: Coins, titleKey: 'routing.bestValue' },
] as const;

export function PricingView() {
  const t = useTranslations('pricing');
  const [cycle, setCycle] = React.useState<BillingCycle>('monthly');

  return (
    <div className="container-page py-14">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-3 text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Cycle switcher */}
      <div className="mt-8 flex justify-center">
        <Tabs value={cycle} onValueChange={(v) => setCycle(v as BillingCycle)}>
          <TabsList>
            <TabsTrigger value="daily">{t('billingToggle.daily')}</TabsTrigger>
            <TabsTrigger value="weekly">{t('billingToggle.weekly')}</TabsTrigger>
            <TabsTrigger value="monthly">{t('billingToggle.monthly')}</TabsTrigger>
            <TabsTrigger value="yearly">{t('billingToggle.yearly')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Smart routing preview */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3 max-w-3xl mx-auto">
        {routingPresets.map((preset) => {
          const Icon = preset.icon;
          return (
            <Card key={preset.id} className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{t('routing.title')}</div>
                <div className="font-medium">{t(preset.titleKey as any)}</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Plan grid */}
      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        {PLANS.map((plan) => {
          const price = plan.prices[cycle];
          const savings = savingsVsMonthly(plan, cycle);
          return (
            <Card
              key={plan.id}
              className={cn(
                'p-6 flex flex-col relative overflow-hidden',
                plan.badge === 'best-value' && 'border-primary shadow-lg',
              )}
            >
              {plan.badge === 'best-value' && (
                <div aria-hidden className="absolute inset-x-0 top-0 h-1 gradient-brand" />
              )}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">{t('includes')}</div>
                  <h3 className="text-2xl font-semibold">{plan.name}</h3>
                </div>
                {plan.badge && (
                  <Badge variant={plan.badge === 'best-value' ? 'gradient' : 'default'}>
                    {plan.badge === 'best-value' ? t('bestValue') : t('popular')}
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground min-h-[2.5rem]">{plan.tagline}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{formatCurrency(price)}</span>
                <span className="text-sm text-muted-foreground">
                  {t(`per.${cycle}` as any)}
                </span>
              </div>
              {savings > 0 && (
                <div className="mt-1 text-xs text-success">{t('savings', { pct: savings })}</div>
              )}

              <ul className="mt-6 space-y-2 text-sm flex-1">
                {plan.includes.map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant={plan.badge === 'best-value' ? 'gradient' : 'default'}
                className="mt-6"
              >
                <Link href={`/sign-up?plan=${plan.id}&cycle=${cycle}`}>{t('cta')}</Link>
              </Button>
              <div className="mt-3 text-xs text-muted-foreground">
                {plan.families.map((f) => MODEL_FAMILIES[f].label).join(' · ')}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Payment methods */}
      <div className="mt-16">
        <div className="text-center text-sm text-muted-foreground mb-4">{t('paymentMethods')}</div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {PAYMENT_METHODS.map((m) => (
            <div
              key={m.id}
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-sm"
            >
              <PaymentIcon id={m.id} />
              <span className="font-medium">{m.label}</span>
              <span className="text-muted-foreground text-xs">— {m.hint}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Compare table */}
      <div className="mt-20">
        <h2 className="font-display text-2xl font-bold text-center">{t('compareTitle')}</h2>
        <div className="mt-6 overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                  {t('feature')}
                </th>
                {PLANS.map((p) => (
                  <th key={p.id} className="px-4 py-3 text-start font-semibold">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Row label="Model families">
                {PLANS.map((p) => (
                  <td key={p.id} className="px-4 py-3">
                    {p.families.map((f) => MODEL_FAMILIES[f].label).join(', ')}
                  </td>
                ))}
              </Row>
              <Row label="Daily requests (soft limit)">
                {PLANS.map((p) => (
                  <td key={p.id} className="px-4 py-3">
                    {p.requestsPerDay.toLocaleString()}
                  </td>
                ))}
              </Row>
              <Row label="Smart routing presets">
                {PLANS.map((p) => (
                  <td key={p.id} className="px-4 py-3">
                    <Check className="h-4 w-4 text-primary" />
                  </td>
                ))}
              </Row>
              <Row label="Priority support">
                {PLANS.map((p) => (
                  <td key={p.id} className="px-4 py-3">
                    {p.id === 'bundle' ||
                    p.id === 'gpt' ||
                    p.id === 'claude' ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                ))}
              </Row>
              <Row label="Models included">
                {PLANS.map((p) => (
                  <td key={p.id} className="px-4 py-3 text-xs text-muted-foreground">
                    {MODELS.filter((m) => p.families.includes(m.family))
                      .slice(0, 4)
                      .map((m) => m.label)
                      .join(', ')}
                    {MODELS.filter((m) => p.families.includes(m.family)).length > 4 && '…'}
                  </td>
                ))}
              </Row>
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Prices are in USD. Local currency and tax are shown at checkout.{' '}
        <Link href="/terms" className="underline">
          Terms
        </Link>{' '}
        ·{' '}
        <Link href="/refund" className="underline">
          Refund policy
        </Link>
      </p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-t border-border/60">
      <td className="px-4 py-3 font-medium">{label}</td>
      {children}
    </tr>
  );
}

function PaymentIcon({ id }: { id: string }) {
  switch (id) {
    case 'card':
      return <CreditCard className="h-4 w-4 text-primary" />;
    case 'binance':
      return <CircleDollarSign className="h-4 w-4 text-yellow-500" />;
    case 'bybit':
      return <Wallet className="h-4 w-4 text-orange-500" />;
    case 'crypto':
      return <Bitcoin className="h-4 w-4 text-amber-500" />;
    default:
      return null;
  }
}
