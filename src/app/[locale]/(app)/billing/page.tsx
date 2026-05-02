import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@/i18n/navigation';
import { CreditCard, Bitcoin, Wallet, CircleDollarSign, Download } from 'lucide-react';
import { PAYMENT_METHODS } from '@/lib/plans';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getSessionUser } from '@/lib/auth';
import { getActiveSubscription, listInvoices } from '@/services/subscriptions';

const REDEEM_MESSAGES: Record<string, { variant: 'success' | 'warning' | 'destructive'; text: string }> = {
  ok: { variant: 'success', text: 'Activation code redeemed. Welcome aboard.' },
  invalid: { variant: 'destructive', text: 'That code is not valid.' },
  used: { variant: 'warning', text: 'This code has already been redeemed.' },
  expired: { variant: 'warning', text: 'This activation code has expired.' },
  error: { variant: 'destructive', text: 'Something went wrong. Try again.' },
};

const CHECKOUT_MESSAGES: Record<string, { variant: 'success' | 'warning' | 'destructive'; text: string }> = {
  ok: { variant: 'success', text: 'Subscription activated. Thank you!' },
  cancel: { variant: 'warning', text: 'Checkout cancelled.' },
  invalid: { variant: 'destructive', text: 'Invalid checkout request.' },
  error: { variant: 'destructive', text: 'Checkout failed. Please try again.' },
};

export default async function BillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'billing' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  const sp = await searchParams;

  const user = await getSessionUser().catch(() => null);
  const userId = user?.id;
  const sub = userId ? await getActiveSubscription(userId) : null;
  const invoices = userId ? await listInvoices(userId) : [];

  const redeemStatus = typeof sp.redeem === 'string' ? sp.redeem : null;
  const checkoutStatus = typeof sp.checkout === 'string' ? sp.checkout : null;

  const remainingMs = sub ? sub.endsAt.getTime() - Date.now() : 0;
  const remainingDays = sub ? Math.max(0, Math.ceil(remainingMs / 86400_000)) : 0;

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          Manage your subscription, payment methods, and invoices.
        </p>
      </div>

      {redeemStatus && REDEEM_MESSAGES[redeemStatus] && (
        <FlashMessage {...REDEEM_MESSAGES[redeemStatus]} />
      )}
      {checkoutStatus && CHECKOUT_MESSAGES[checkoutStatus] && (
        <FlashMessage {...CHECKOUT_MESSAGES[checkoutStatus]} />
      )}

      {sub ? (
        <Card className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {t('plan')}
            </div>
            <div className="mt-1 text-xl font-semibold">
              {sub.planName} · <span className="capitalize">{sub.cycle}</span>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {t('expiresOn', { date: formatDate(sub.endsAt, locale) })} · {remainingDays}{' '}
              days remaining
            </div>
            <Badge className="mt-3" variant="success">
              {t('active')}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/pricing">{t('changePlan')}</Link>
            </Button>
            <Button asChild variant="gradient">
              <Link href="/pricing">{t('upgrade')}</Link>
            </Button>
            <form action="/api/billing/cancel" method="post">
              <Button type="submit" variant="ghost">
                {t('cancelPlan')}
              </Button>
            </form>
          </div>
        </Card>
      ) : (
        <Card className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-primary/40">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {t('plan')}
            </div>
            <div className="mt-1 text-xl font-semibold">No active subscription</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Pick a plan to start routing through every model with one API key.
            </div>
          </div>
          <Button asChild variant="gradient">
            <Link href="/pricing">Browse plans</Link>
          </Button>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="font-semibold">{t('paymentMethod')}</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <div
                key={m.id}
                className="rounded-lg border border-border/60 p-3 flex items-center gap-2 text-sm"
              >
                <PaymentIcon id={m.id} />
                <div>
                  <div className="font-medium">{m.label}</div>
                  <div className="text-xs text-muted-foreground">{m.hint}</div>
                </div>
              </div>
            ))}
          </div>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/pricing">Choose a plan to pay</Link>
          </Button>
        </Card>

        <Card className="p-6">
          <div className="font-semibold">{t('redeemTitle')}</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Redeem a giveaway or manually-issued activation code.
          </p>
          <form className="mt-4 flex gap-2" action="/api/billing/redeem" method="post">
            <div className="flex-1 space-y-2">
              <Label htmlFor="code" className="sr-only">
                Code
              </Label>
              <Input id="code" name="code" placeholder={t('redeemPlaceholder')} required />
            </div>
            <Button type="submit" variant="gradient">
              {t('redeem')}
            </Button>
          </form>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 pb-3 flex items-center justify-between">
          <div className="font-semibold">{t('invoices')}</div>
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4" /> Export all
          </Button>
        </div>
        {invoices.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            {tc('noData')}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id} className="border-t border-border/60">
                  <td className="px-4 py-3">{formatDate(i.date, locale)}</td>
                  <td className="px-4 py-3">{i.plan}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatCurrency(i.amount, 'USD', locale)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="success">{i.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" /> PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function FlashMessage({
  variant,
  text,
}: {
  variant: 'success' | 'warning' | 'destructive';
  text: string;
}) {
  const cls =
    variant === 'success'
      ? 'border-success/40 bg-success/10 text-success'
      : variant === 'warning'
      ? 'border-warning/40 bg-warning/10 text-warning'
      : 'border-destructive/40 bg-destructive/10 text-destructive';
  return <div className={`rounded-lg border px-4 py-3 text-sm ${cls}`}>{text}</div>;
}

function PaymentIcon({ id }: { id: string }) {
  switch (id) {
    case 'card':
      return <CreditCard className="h-5 w-5 text-primary" />;
    case 'binance':
      return <CircleDollarSign className="h-5 w-5 text-yellow-500" />;
    case 'bybit':
      return <Wallet className="h-5 w-5 text-orange-500" />;
    case 'crypto':
      return <Bitcoin className="h-5 w-5 text-amber-500" />;
    default:
      return null;
  }
}
