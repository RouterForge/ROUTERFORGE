import { setRequestLocale } from 'next-intl/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const flags = Array.from({ length: 10 }).map((_, i) => ({
  id: `flag_${i}`,
  user: `user${1000 + i}@routerforge.example`,
  severity: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][i % 4],
  reason: [
    'Token burn 4× baseline',
    'Repeated policy-violation attempts',
    'Failed auth surge',
    'Geo anomaly',
    'Suspicious model mix',
  ][i % 5],
  resolved: i % 4 === 0,
  createdAt: new Date(Date.now() - i * 3_600_000).toISOString(),
}));

export default async function AbusePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Abuse signals</h1>
      <Card className="overflow-hidden bg-zinc-900/40 border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800/40 text-zinc-400">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Severity</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {flags.map((f) => (
              <tr key={f.id} className="border-t border-zinc-800">
                <td className="px-4 py-3">{f.user}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      f.severity === 'CRITICAL' || f.severity === 'HIGH'
                        ? 'destructive'
                        : f.severity === 'MEDIUM'
                        ? 'warning'
                        : 'soft'
                    }
                  >
                    {f.severity}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {f.resolved ? (
                      <ShieldCheck className="h-4 w-4 text-success" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 text-warning" />
                    )}
                    {f.reason}
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-400">{formatDate(f.createdAt, locale)}</td>
                <td className="px-4 py-3">
                  {f.resolved ? (
                    <Badge variant="success">Resolved</Badge>
                  ) : (
                    <Badge variant="warning">Open</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-end">
                  <Button size="sm" variant="ghost">
                    Review
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
