import { setRequestLocale } from 'next-intl/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

const tickets = Array.from({ length: 8 }).map((_, i) => ({
  id: `tkt_${1000 + i}`,
  user: `user${i + 1}@routerforge.example`,
  subject: [
    'Renewal failed with Polar',
    'Activation code did not redeem',
    'Streaming chat hangs on Gemini',
    'Need invoice in EUR',
    'Account locked after 2FA',
  ][i % 5],
  status: ['OPEN', 'PENDING', 'OPEN', 'RESOLVED', 'CLOSED'][i % 5],
  createdAt: new Date(Date.now() - i * 7_200_000).toISOString(),
}));

export default async function AdminTickets({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Support tickets</h1>
      <Card className="overflow-hidden bg-zinc-900/40 border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800/40 text-zinc-400">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Subject</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} className="border-t border-zinc-800">
                <td className="px-4 py-3 font-mono text-xs">{t.id}</td>
                <td className="px-4 py-3">{t.user}</td>
                <td className="px-4 py-3">{t.subject}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      t.status === 'OPEN'
                        ? 'destructive'
                        : t.status === 'PENDING'
                        ? 'warning'
                        : 'success'
                    }
                  >
                    {t.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-zinc-400">{formatDate(t.createdAt, locale)}</td>
                <td className="px-4 py-3 text-end">
                  <Button size="sm" variant="ghost">
                    Open
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
