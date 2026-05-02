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
import {
  PLANS,
  PERIODS,
  PAYMENT_METHODS,
  DEFAULT_PERIOD_ID,
  priceFor,
  savingsVs1m,
  type PlanTier,
  type Period,
  type PeriodId,
} from '@/lib/plans';
import { cn, formatCurrency } from '@/lib/utils';

const routingPresets = [
  { id: 'fastest', icon: Gauge, titleKey: 'routing.fastest' },
  { id: 'bestReasoning', icon: Target, titleKey: 'routing.bestReasoning' },
  { id: 'bestValue', icon: Coins, titleKey: 'routing.bestValue' },
] as const;

export function PricingView() {
  const t = useTranslations('pricing');
  const [selectedId, setSelectedId] = React.useState<string>('bundle');
  const [periodId, setPeriodId] = React.useState<PeriodId>(DEFAULT_PERIOD_ID);

  const selectedPlan = PLANS.find((p) => p.id === selectedId) ?? PLANS[0];
  const period = PERIODS.find((p) => p.id === periodId) ?? PERIODS[4];

  return (
    <div className="container-page py-14">
      <div className="max-w-3xl mx-auto text-center">
        <div className="text-xs font-semibold tracking-[0.2em] text-primary uppercase mb-3">
          RouterForge Pricing
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
          {t('title')}
        </h1>
        <p className="mt-3 text-muted-foreground">
          Pay only for what you need. Cancel anytime.
        </p>
      </div>

      {/* Plan selector cards */}
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {PLANS.map((p) => {
          const selected = p.id === selectedId;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              type="button"
              className={cn(
                'relative text-start rounded-2xl border p-4 transition-all outline-none',
                selected
                  ? 'shadow-lg -translate-y-0.5 ring-2'
                  : 'hover:border-foreground/20 hover:shadow-md hover:-translate-y-0.5',
              )}
              style={{
                borderColor: selected ? p.color : 'hsl(var(--border))',
                background: selected
                  ? `linear-gradient(135deg, ${p.color}22, hsl(var(--card)))`
                  : 'hsl(var(--card))',
                boxShadow: selected ? `0 10px 40px -12px ${p.color}55` : undefined,
                ...(selected
                  ? ({ '--tw-ring-color': `${p.color}66` } as React.CSSProperties)
                  : {}),
              }}
            >
              {p.badge && (
                <span
                  className="absolute -top-2 right-3 text-[10px] font-semibold tracking-wider uppercase rounded-full px-2 py-0.5 text-black"
                  style={{ background: p.color }}
                >
                  {p.badge}
                </span>
              )}
              <div className="font-semibold" style={{ color: selected ? p.color : undefined }}>
                {p.name}
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
                {p.subtitle}
              </div>
              <div className="mt-3 text-lg font-bold tabular-nums">
                {formatCurrency(priceFor(p, period))}
                <span className="ms-1 text-xs font-normal text-muted-foreground">
                  / {period.unit}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Period selector */}
      <Card className="mt-6 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Billing period
        </div>
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
          {PERIODS.map((p) => {
            const active = p.id === periodId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriodId(p.id)}
                className={cn(
                  'relative rounded-lg border px-2 py-2 text-center text-xs font-medium transition-all',
                  active
                    ? 'border-transparent text-white shadow'
                    : 'border-border bg-background hover:border-foreground/20',
                )}
                style={{
                  background: active ? selectedPlan.color : undefined,
                }}
              >
                <div>{p.label}</div>
                {p.discount > 0 && (
                  <div
                    className={cn(
                      'mt-0.5 text-[10px]',
                      active ? 'text-white/90' : 'text-primary',
                    )}
                  >
                    −{Math.round(p.discount * 100)}%
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Hero price display */}
      <HeroPrice plan={selectedPlan} period={period} />

      {/* Models included + checkout */}
      <Card className="mt-6 p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Models included
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {selectedPlan.models.map((m) => (
            <li key={m} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 shrink-0" style={{ color: selectedPlan.color }} />
              <span>{m}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Checkout method
        </div>
        <form
          method="post"
          action="/api/billing/checkout"
          className="grid gap-2 sm:grid-cols-4"
        >
          <input type="hidden" name="planId" value={selectedPlan.id} />
          <input type="hidden" name="periodId" value={period.id} />
          {(['card', 'binance', 'bybit', 'crypto'] as const).map((m) => (
            <label
              key={m}
              className={cn(
                'flex items-center gap-2 rounded-lg border border-border/60 p-3 text-sm cursor-pointer hover:bg-accent transition-colors',
              )}
            >
              <input
                type="radio"
                name="method"
                value={m}
                defaultChecked={m === 'card'}
                className="accent-primary"
              />
              <PaymentIcon id={m} />
              <span className="font-medium capitalize">{methodLabel(m)}</span>
            </label>
          ))}

          <div className="sm:col-span-4 mt-2 flex flex-wrap gap-2">
            <Button
              type="submit"
              size="lg"
              className="text-white"
              style={{
                background: `linear-gradient(135deg, ${selectedPlan.color}, ${selectedPlan.color}cc)`,
                boxShadow: `0 10px 30px -10px ${selectedPlan.color}99`,
              }}
            >
              Pay {formatCurrency(priceFor(selectedPlan, period))} · {selectedPlan.name}
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact">Talk to sales</Link>
            </Button>
          </div>
        </form>
      </Card>

      {/* Smart routing mini row */}
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

      {/* Full pricing table */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-bold">Full pricing · {period.label}</h2>
          <Badge variant="soft">{period.label}</Badge>
        </div>
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Models</th>
                <th className="px-4 py-3 font-medium text-end">Price ({period.label})</th>
                <th className="px-4 py-3 font-medium text-end">You save</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {PLANS.map((p) => {
                const price = priceFor(p, period);
                const save = savingsVs1m(p, period);
                return (
                  <tr
                    key={p.id}
                    className={cn(
                      'border-t border-border/60',
                      selectedId === p.id && 'bg-primary/5',
                    )}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 font-semibold">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: p.color }}
                        />
                        {p.name}
                        {p.badge && (
                          <Badge
                            variant="soft"
                            className="text-[10px] uppercase tracking-wider"
                          >
                            {p.badge}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {p.subtitle}
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell text-xs text-muted-foreground">
                      {p.models.slice(0, 3).join(', ')}
                      {p.models.length > 3 && '…'}
                    </td>
                    <td className="px-4 py-4 text-end">
                      <div className="tabular-nums text-lg font-bold" style={{ color: p.color }}>
                        {formatCurrency(price)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">/ {period.unit}</div>
                    </td>
                    <td className="px-4 py-4 text-end">
                      {save > 0 ? (
                        <Badge variant="success">Save {save}%</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-end">
                      <Button
                        size="sm"
                        variant={selectedId === p.id ? 'gradient' : 'outline'}
                        onClick={() => {
                          setSelectedId(p.id);
                          if (typeof window !== 'undefined') {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                      >
                        Choose
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Payment methods */}
      <div className="mt-14">
        <div className="text-center text-sm text-muted-foreground mb-4">
          {t('paymentMethods')}
        </div>
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

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Prices in USD. Local currency and tax shown at checkout. By subscribing you
        agree to our{' '}
        <Link href="/terms" className="underline">
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/refund" className="underline">
          Refund Policy
        </Link>
        .
      </p>
    </div>
  );
}

function HeroPrice({ plan, period }: { plan: PlanTier; period: Period }) {
  const price = priceFor(plan, period);
  const savings = savingsVs1m(plan, period);
  return (
    <div
      className="mt-6 rounded-2xl border p-8 sm:p-10 text-center relative overflow-hidden"
      style={{
        borderColor: `${plan.color}55`,
        background: `linear-gradient(135deg, ${plan.color}22, hsl(var(--card)))`,
      }}
    >
      <div
        aria-hidden
        className="absolute -top-24 left-1/2 -translate-x-1/2 h-56 w-[32rem] rounded-full blur-3xl opacity-40"
        style={{ background: plan.color }}
      />
      <div className="relative">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {plan.name} · {period.label}
        </div>
        <div
          className="mt-2 font-display font-black tabular-nums leading-none"
          style={{ color: plan.color, fontSize: 'clamp(3rem, 8vw, 5rem)' }}
        >
          {formatCurrency(price)}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">per {period.unit}</div>
        {savings > 0 && (
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-success/15 text-success px-3 py-1 text-xs font-semibold">
            🎉 Save {savings}% vs. monthly rate
          </div>
        )}
        <p className="mt-4 text-sm text-muted-foreground max-w-xl mx-auto">{plan.description}</p>
      </div>
    </div>
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

function methodLabel(id: 'card' | 'binance' | 'bybit' | 'crypto'): string {
  switch (id) {
    case 'card':
      return 'Card';
    case 'binance':
      return 'Binance';
    case 'bybit':
      return 'Bybit';
    case 'crypto':
      return 'Crypto';
  }
}
