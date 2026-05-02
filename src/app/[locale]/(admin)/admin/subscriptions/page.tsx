import { setRequestLocale } from 'next-intl/server';
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
import { listAdminSubscriptions } from '@/services/admin-subscriptions';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function AdminSubscriptions({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const rows = await listAdminSubscriptions();
  return (
    <div>
      <AdminPageHeader title="Subscriptions" description="Active and historical subscriptions across all users." />
      <AdminCard className="overflow-hidden">
        <AdminTable
          head={
            <>
              <Th>Subscription</Th>
              <Th>User</Th>
              <Th>Plan</Th>
              <Th>Cycle</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th>Ends</Th>
              <Th />
            </>
          }
        >
          {rows.map((s) => (
            <Tr key={s.id}>
              <Td className="font-mono text-xs">{s.id}</Td>
              <Td>{s.userEmail}</Td>
              <Td>{s.planName}</Td>
              <Td className="capitalize">{s.cycle}</Td>
              <Td className="tabular-nums">{formatCurrency(s.amount, 'USD', locale)}</Td>
              <Td>
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
              </Td>
              <Td className="text-muted-foreground">{formatDate(s.endsAt, locale)}</Td>
              <Td className="text-end">
                <Button variant="ghost" size="sm">
                  Manage
                </Button>
              </Td>
            </Tr>
          ))}
        </AdminTable>
      </AdminCard>
    </div>
  );
}
