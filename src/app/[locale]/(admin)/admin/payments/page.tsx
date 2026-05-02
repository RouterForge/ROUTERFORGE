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
import { listAdminPayments } from '@/services/admin-payments';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function AdminPayments({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const rows = await listAdminPayments();
  return (
    <div>
      <AdminPageHeader
        title="Payments"
        description="All payment attempts across Polar.sh, Binance Pay, Bybit Pay, and on-chain crypto."
      />
      <AdminCard className="overflow-hidden">
        <AdminTable
          head={
            <>
              <Th>ID</Th>
              <Th>User</Th>
              <Th>Provider</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th />
            </>
          }
        >
          {rows.map((p) => (
            <Tr key={p.id}>
              <Td className="font-mono text-xs">{p.id}</Td>
              <Td>{p.userEmail}</Td>
              <Td>{p.provider}</Td>
              <Td className="tabular-nums">{formatCurrency(p.amount, 'USD', locale)}</Td>
              <Td>
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
              </Td>
              <Td className="text-muted-foreground">{formatDate(p.createdAt, locale)}</Td>
              <Td className="text-end">
                {p.status === 'MANUAL_REVIEW' ? (
                  <Button size="sm" variant="gradient">
                    Approve
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost">
                    Inspect
                  </Button>
                )}
              </Td>
            </Tr>
          ))}
        </AdminTable>
      </AdminCard>
    </div>
  );
}
