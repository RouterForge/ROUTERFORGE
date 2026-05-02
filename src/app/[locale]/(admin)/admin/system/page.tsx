import { setRequestLocale } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';
import { AdminCard, AdminPageHeader } from '@/components/admin/admin-page';
import { cliproxyAdmin } from '@/services/cliproxy-admin';

const components = [
  { name: 'Web app', region: 'global' },
  { name: 'API gateway', region: 'us-east' },
  { name: 'Worker queue', region: 'us-east' },
  { name: 'Database (primary)', region: 'us-east' },
  { name: 'Cache', region: 'us-east' },
  { name: 'Object storage', region: 'us-east' },
];

export default async function AdminSystem({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const upstreamHealth = await cliproxyAdmin.health();

  return (
    <div>
      <AdminPageHeader title="System health" description="Platform components and upstream CLIProxyAPI instance." />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {components.map((c) => (
          <AdminCard key={c.name} className="p-6">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{c.name}</div>
              <Badge variant="success">operational</Badge>
            </div>
            <div className="mt-2 text-xs text-muted-foreground uppercase tracking-wider">
              {c.region}
            </div>
          </AdminCard>
        ))}
        <AdminCard className="p-6 border-primary/30">
          <div className="flex items-center justify-between">
            <div className="font-semibold">CLIProxyAPI Plus</div>
            <Badge
              variant={
                cliproxyAdmin.info().configured
                  ? upstreamHealth.ok
                    ? 'success'
                    : 'destructive'
                  : 'soft'
              }
            >
              {cliproxyAdmin.info().configured
                ? upstreamHealth.ok
                  ? 'operational'
                  : 'unreachable'
                : 'not configured'}
            </Badge>
          </div>
          <div className="mt-2 text-xs text-muted-foreground uppercase tracking-wider">
            upstream router
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
