import { setRequestLocale } from 'next-intl/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';

const items = Array.from({ length: 14 }).map((_, i) => ({
  id: `pay_${(8400 + i).toString(36)}`,
  user: `user${i + 1}@routerforge.example`,
  provider: ['POLAR', 'BINANCE', 'BYBIT', 'CRYPTO'][i % 4],
  amount: [19, 39, 49, 119, 8][i % 5],
  status: ['SUCCEEDED', 'SUCCEEDED', 'PENDING', 'MANUAL_REVIEW', 'FAILED'][i % 5],
  createdAt: new Date(Date.now() - i * 600_000).toISOString(),
}));

export default async function AdminPayments({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Payments</h1>
      <Card className="overflow-hidden bg-zinc-900/40 border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800/40 text-zinc-400">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Provider</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t border-zinc-800">
                <td className="px-4 py-3 font-mono text-xs">{p.id}</td>
                <td className="px-4 py-3">{p.user}</td>
                <td className="px-4 py-3">{p.provider}</td>
                <td className="px-4 py-3 tabular-nums">
                  {formatCurrency(p.amount, 'USD', locale)}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      p.status === 'SUCCEEDED'
                        ? 'success'
                        : p.status === 'FAILED'
                        ? 'destructive'
                        : 'warning'
                    }
                  >
                    {p.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-zinc-400">{formatDate(p.createdAt, locale)}</td>
                <td className="px-4 py-3 text-end">
                  {p.status === 'MANUAL_REVIEW' ? (
                    <Button size="sm" variant="gradient">
                      Approve
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost">
                      Inspect
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
