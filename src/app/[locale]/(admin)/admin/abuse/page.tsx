import { setRequestLocale } from 'next-intl/server';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  Td,
  Th,
  Tr,
} from '@/components/admin/admin-page';
import { listAbuseFlags } from '@/services/admin-abuse';
import { formatDate } from '@/lib/utils';

export default async function AbusePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const rows = await listAbuseFlags();
  return (
    <div>
      <AdminPageHeader
        title="Abuse signals"
        description="Automated and operator-reported abuse signals. Severity drives automated response."
      />
      <AdminCard className="overflow-hidden">
        <AdminTable
          head={
            <>
              <Th>User</Th>
              <Th>Severity</Th>
              <Th>Reason</Th>
              <Th>Created</Th>
              <Th>Status</Th>
              <Th />
            </>
          }
        >
          {rows.map((f) => (
            <Tr key={f.id}>
              <Td>{f.userEmail}</Td>
              <Td>
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
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  {f.resolved ? (
                    <ShieldCheck className="h-4 w-4 text-success" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 text-warning" />
                  )}
                  {f.reason}
                </div>
              </Td>
              <Td className="text-muted-foreground">{formatDate(f.createdAt, locale)}</Td>
              <Td>
                {f.resolved ? (
                  <Badge variant="success">Resolved</Badge>
                ) : (
                  <Badge variant="warning">Open</Badge>
                )}
              </Td>
              <Td className="text-end">
                <Button size="sm" variant="ghost">
                  Review
                </Button>
              </Td>
            </Tr>
          ))}
        </AdminTable>
      </AdminCard>
    </div>
  );
}
