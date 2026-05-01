import { setRequestLocale } from 'next-intl/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const components = [
  { name: 'Web app', status: 'operational', region: 'global' },
  { name: 'API gateway', status: 'operational', region: 'us-east' },
  { name: 'Worker queue', status: 'operational', region: 'us-east' },
  { name: 'Database (primary)', status: 'operational', region: 'us-east' },
  { name: 'Cache', status: 'operational', region: 'us-east' },
  { name: 'Object storage', status: 'operational', region: 'us-east' },
  { name: 'Webhooks dispatcher', status: 'degraded', region: 'eu-west' },
];

export default async function AdminSystem({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">System health</h1>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {components.map((c) => (
          <Card key={c.name} className="p-6 bg-zinc-900/40 border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{c.name}</div>
              <Badge variant={c.status === 'operational' ? 'success' : 'warning'}>{c.status}</Badge>
            </div>
            <div className="mt-2 text-xs text-zinc-400 uppercase tracking-wider">{c.region}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
