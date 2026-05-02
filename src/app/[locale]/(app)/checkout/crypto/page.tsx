import { setRequestLocale } from 'next-intl/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bitcoin } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getPlan, getPeriod, priceFor } from '@/lib/plans';
import { formatCurrency } from '@/lib/utils';

const ADDRESSES: Record<string, string> = {
  USDT: process.env.CRYPTO_ADDRESS_USDT ?? 'TP4iL...sample',
  USDC: process.env.CRYPTO_ADDRESS_USDC ?? '0xUSDC...sample',
  BTC: process.env.CRYPTO_ADDRESS_BTC ?? 'bc1q...sample',
  ETH: process.env.CRYPTO_ADDRESS_ETH ?? '0xETH...sample',
};

export default async function CryptoCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const ref = String(sp.ref ?? '');
  const planId = String(sp.planId ?? 'oss');
  const cycle = String(sp.cycle ?? 'monthly');
  const amount = Number(sp.amount ?? 0);
  const periodId =
    cycle === 'daily' ? '1d' : cycle === 'weekly' ? '1w' : cycle === 'yearly' ? '1y' : '1m';

  const plan = getPlan(planId);
  const period = getPeriod(periodId);
  const total = plan ? priceFor(plan, period) : amount;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Pay with crypto</h1>
        <p className="text-muted-foreground">
          Send the exact amount to one of the addresses below. Your subscription activates
          automatically once the network confirms.
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="soft" className="mb-2">
              <Bitcoin className="h-3 w-3 me-1 inline-block" /> On-chain payment
            </Badge>
            <div className="font-semibold text-xl">{plan?.name ?? planId}</div>
            <div className="text-sm text-muted-foreground">
              {period.label} · ref <span className="font-mono">{ref}</span>
            </div>
          </div>
          <div className="text-end">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Amount</div>
            <div className="text-3xl font-bold tabular-nums">{formatCurrency(total)}</div>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="font-semibold">Send to one of these addresses</div>
        <div className="grid gap-2">
          {(['USDT', 'USDC', 'BTC', 'ETH'] as const).map((sym) => (
            <div
              key={sym}
              className="flex items-center justify-between gap-2 rounded-lg border border-border/60 p-3"
            >
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {sym}
                </div>
                <div className="font-mono text-sm break-all">{ADDRESSES[sym]}</div>
              </div>
              <code className="text-xs px-2 py-1 rounded bg-muted">{sym}</code>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Include the reference <span className="font-mono">{ref}</span> in the memo
          when possible. Activation happens after blockchain confirmation
          (typically 1–10 min).
        </p>
      </Card>

      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link href="/billing">Back to billing</Link>
        </Button>
        <Button asChild>
          <Link href="/contact">I have a payment issue</Link>
        </Button>
      </div>
    </div>
  );
}
