import { setRequestLocale } from 'next-intl/server';
import { Download, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  Td,
  Th,
  Tr,
} from '@/components/admin/admin-page';
import { listActivationCodes, createActivationCodes } from '@/services/admin-keys';
import { formatDate } from '@/lib/utils';
import { PLANS } from '@/lib/plans';

export default async function AdminKeysPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const rows = await listActivationCodes();

  return (
    <div>
      <AdminPageHeader
        title="Activation keys"
        description="Generate batches of activation codes for giveaways, partners, or manual payments. Codes can be redeemed by users in Billing → Redeem code."
        actions={
          <Button variant="outline">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <AdminCard className="p-6 mb-6">
        <div className="font-semibold flex items-center gap-2">
          <Plus className="h-4 w-4" /> Generate keys
        </div>
        <form action={createActivationCodes} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label>Plan</Label>
            <Select name="planId" defaultValue="gpt">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLANS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cycle</Label>
            <Select name="cycle" defaultValue="monthly">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Duration (days)</Label>
            <Input type="number" name="durationDays" defaultValue={30} />
          </div>
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input type="number" name="quantity" defaultValue={10} min={1} max={1000} />
          </div>
          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Input name="note" placeholder="Giveaway, partner, etc." />
          </div>
          <div className="lg:col-span-5 flex justify-end">
            <Button type="submit" variant="gradient">
              Generate
            </Button>
          </div>
        </form>
      </AdminCard>

      <AdminCard className="overflow-hidden">
        <AdminTable
          head={
            <>
              <Th>Code</Th>
              <Th>Plan / Cycle</Th>
              <Th>Duration</Th>
              <Th>Status</Th>
              <Th>Issued</Th>
              <Th>Expires</Th>
              <Th>By</Th>
            </>
          }
        >
          {rows.map((c) => (
            <Tr key={c.code}>
              <Td className="font-mono text-xs">{c.code}</Td>
              <Td>
                {c.planId ?? '—'} · {c.cycle ?? '—'}
              </Td>
              <Td>{c.durationDays ? `${c.durationDays}d` : '—'}</Td>
              <Td>
                <Badge variant={c.redeemed ? 'success' : 'soft'}>
                  {c.redeemed ? 'Redeemed' : 'Available'}
                </Badge>
              </Td>
              <Td className="text-muted-foreground">{formatDate(c.createdAt, locale)}</Td>
              <Td className="text-muted-foreground">
                {c.expiresAt ? formatDate(c.expiresAt, locale) : '—'}
              </Td>
              <Td className="text-muted-foreground text-xs">{c.issuedBy ?? '—'}</Td>
            </Tr>
          ))}
        </AdminTable>
      </AdminCard>
    </div>
  );
}
