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
import { listSupportTickets } from '@/services/admin-tickets';
import { formatDate } from '@/lib/utils';

export default async function AdminTickets({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tickets = await listSupportTickets();
  return (
    <div>
      <AdminPageHeader title="Support tickets" description="User-submitted tickets awaiting response or resolution." />
      <AdminCard className="overflow-hidden">
        <AdminTable
          head={
            <>
              <Th>ID</Th>
              <Th>User</Th>
              <Th>Subject</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th />
            </>
          }
        >
          {tickets.map((t) => (
            <Tr key={t.id}>
              <Td className="font-mono text-xs">{t.id}</Td>
              <Td>{t.userEmail}</Td>
              <Td>{t.subject}</Td>
              <Td>
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
              </Td>
              <Td className="text-muted-foreground">{formatDate(t.createdAt, locale)}</Td>
              <Td className="text-end">
                <Button size="sm" variant="ghost">
                  Open
                </Button>
              </Td>
            </Tr>
          ))}
        </AdminTable>
      </AdminCard>
    </div>
  );
}
