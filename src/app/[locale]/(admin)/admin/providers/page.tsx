import { setRequestLocale } from 'next-intl/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const providers = [
  { id: 'cliproxy', name: 'CLIProxyAPI Plus', status: 'operational', latency: '184 ms', share: '100%' },
  { id: 'openai', name: 'OpenAI / GPT', status: 'operational', latency: '420 ms', share: '36%' },
  { id: 'anthropic', name: 'Anthropic Claude', status: 'operational', latency: '510 ms', share: '21%' },
  { id: 'google', name: 'Google Gemini', status: 'degraded', latency: '780 ms', share: '24%' },
  { id: 'oss', name: 'Open-source pool', status: 'operational', latency: '290 ms', share: '19%' },
];

export default async function AdminProviders({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Providers</h1>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {providers.map((p) => (
          <Card key={p.id} className="p-6 bg-zinc-900/40 border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{p.name}</div>
              <Badge variant={p.status === 'operational' ? 'success' : 'warning'}>
                {p.status}
              </Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wider text-zinc-400">p95 latency</div>
                <div className="font-medium tabular-nums">{p.latency}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-zinc-400">traffic share</div>
                <div className="font-medium tabular-nums">{p.share}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
