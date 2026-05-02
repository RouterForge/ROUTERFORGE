import { setRequestLocale } from 'next-intl/server';
import { Search, Download, Ban, ShieldCheck } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AdminPageHeader,
  AdminCard,
  AdminTable,
  Th,
  Td,
  Tr,
} from '@/components/admin/admin-page';
import { listAdminUsers } from '@/services/admin-users';
import { formatDate, formatNumber } from '@/lib/utils';

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q } = await searchParams;
  setRequestLocale(locale);

  const rows = await listAdminUsers(q ?? '');

  return (
    <div>
      <AdminPageHeader
        title="Users"
        description="Search by email, id, or subscription. Data comes from the database; falls back to sample rows when empty."
        actions={
          <>
            <form className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={q ?? ''}
                placeholder="Search users…"
                className="pl-9 w-72"
              />
            </form>
            <Button variant="outline">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </>
        }
      />

      <AdminCard className="overflow-hidden">
        <AdminTable
          head={
            <>
              <Th>User</Th>
              <Th>Role</Th>
              <Th>Plan</Th>
              <Th>Status</Th>
              <Th>Requests (30d)</Th>
              <Th>Joined</Th>
              <Th />
            </>
          }
        >
          {rows.map((u) => (
            <Tr key={u.id}>
              <Td>
                <div className="font-medium">{u.email}</div>
                <div className="text-xs text-muted-foreground font-mono">{u.id}</div>
              </Td>
              <Td>
                <Badge
                  variant={
                    u.role === 'SUPER_ADMIN'
                      ? 'gradient'
                      : u.role === 'ADMIN'
                        ? 'destructive'
                        : 'soft'
                  }
                >
                  {u.role}
                </Badge>
              </Td>
              <Td>{u.plan}</Td>
              <Td>
                <Badge
                  variant={
                    u.status === 'ACTIVE'
                      ? 'success'
                      : u.status === 'PAUSED'
                        ? 'warning'
                        : u.status === 'EXPIRED'
                          ? 'destructive'
                          : 'soft'
                  }
                >
                  {u.status}
                </Badge>
              </Td>
              <Td className="tabular-nums">{formatNumber(u.requests30d, locale)}</Td>
              <Td className="text-muted-foreground">{formatDate(u.createdAt, locale)}</Td>
              <Td className="text-end">
                {u.role === 'USER' ? (
                  <Button variant="ghost" size="sm">
                    <Ban className="h-4 w-4" /> Suspend
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm">
                    <ShieldCheck className="h-4 w-4" /> Audit
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
