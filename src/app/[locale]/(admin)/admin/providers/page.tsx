import { setRequestLocale } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';
import { AdminCard, AdminPageHeader } from '@/components/admin/admin-page';
import { cliproxyAdmin } from '@/services/cliproxy-admin';

const providers = [
  { id: 'cliproxy', name: 'CLIProxyAPI Plus', share: '100%' },
  { id: 'openai', name: 'OpenAI / GPT', share: '36%' },
  { id: 'anthropic', name: 'Anthropic Claude', share: '21%' },
  { id: 'google', name: 'Google Gemini', share: '24%' },
  { id: 'oss', name: 'Open-source pool', share: '19%' },
];

export default async function AdminProviders({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const healthList = await cliproxyAdmin.getProviderHealth();
  const byId = new Map(healthList.map((h) => [h.id, h.status]));

  return (
    <div>
      <AdminPageHeader title="Providers" description="Status and traffic share across upstream model providers." />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {providers.map((p) => {
          const status = byId.get(p.id) ?? 'operational';
          return (
            <AdminCard key={p.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{p.name}</div>
                <Badge variant={status === 'operational' ? 'success' : 'warning'}>
                  {status}
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    traffic share
                  </div>
                  <div className="font-medium tabular-nums">{p.share}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    routing via
                  </div>
                  <div className="font-medium">CLIProxyAPI Plus</div>
                </div>
              </div>
            </AdminCard>
          );
        })}
      </div>
    </div>
  );
}
