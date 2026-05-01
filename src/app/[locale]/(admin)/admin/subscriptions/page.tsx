import { setRequestLocale } from 'next-intl/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';

const subs = Array.from({ length: 12 }).map((_, i) => ({
  id: `sub_${(2400 + i).toString(36)}`,
  user: `user${i + 1}@routerforge.example`,
  plan: ['Open Source', 'Gemini', 'GPT / Codex', 'Claude', 'Bundle'][i % 5],
  cycle: ['monthly', 'yearly', 'weekly'][i % 3],
  amount: [19, 39, 49, 119][i % 4],
  status: ['ACTIVE', 'ACTIVE', 'EXPIRED', 'PAUSED', 'ACTIVE'][i % 5],
  ends: new Date(Date.now() + (i - 4) * 86400_000).toISOString(),
}));

export default async function AdminSubscriptions({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Subscriptions</h1>
      <Card className="overflow-hidden bg-zinc-900/40 border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800/40 text-zinc-400">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Subscription</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Cycle</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Ends</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id} className="border-t border-zinc-800">
                <td className="px-4 py-3 font-mono text-xs">{s.id}</td>
                <td className="px-4 py-3">{s.user}</td>
                <td className="px-4 py-3">{s.plan}</td>
                <td className="px-4 py-3 capitalize">{s.cycle}</td>
                <td className="px-4 py-3 tabular-nums">{formatCurrency(s.amount, 'USD', locale)}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      s.status === 'ACTIVE'
                        ? 'success'
                        : s.status === 'PAUSED'
                        ? 'warning'
                        : 'destructive'
                    }
                  >
                    {s.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-zinc-400">{formatDate(s.ends, locale)}</td>
                <td className="px-4 py-3 text-end">
                  <Button variant="ghost" size="sm">
                    Manage
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
