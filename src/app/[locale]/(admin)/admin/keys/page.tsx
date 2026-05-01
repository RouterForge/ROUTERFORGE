import { setRequestLocale } from 'next-intl/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Download } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const codes = Array.from({ length: 12 }).map((_, i) => ({
  code: `RF-${(Math.random() * 1e9).toString(36).slice(0, 4).toUpperCase()}-${i.toString().padStart(4, '0')}`,
  plan: ['Open Source', 'GPT / Codex', 'Bundle'][i % 3],
  cycle: ['monthly', 'yearly'][i % 2],
  duration: [30, 365][i % 2],
  redeemed: i % 3 === 0,
  expires: new Date(Date.now() + (i + 5) * 86400_000).toISOString(),
  issued: new Date(Date.now() - i * 86400_000).toISOString(),
  issuedBy: 'admin@routerforge.example',
}));

export default async function AdminKeysPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <h1 className="font-display text-3xl font-bold tracking-tight">Activation keys</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Card className="p-6 bg-zinc-900/40 border-zinc-800 space-y-4">
        <div className="font-semibold flex items-center gap-2">
          <Plus className="h-4 w-4" /> Generate keys
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Plan</Label>
            <Select defaultValue="gpt">
              <SelectTrigger className="bg-zinc-900 border-zinc-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oss">Open Source</SelectItem>
                <SelectItem value="gemini">Gemini</SelectItem>
                <SelectItem value="gpt">GPT / Codex</SelectItem>
                <SelectItem value="claude">Claude</SelectItem>
                <SelectItem value="bundle">Bundle</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Duration</Label>
            <Select defaultValue="30">
              <SelectTrigger className="bg-zinc-900 border-zinc-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="365">365 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input type="number" defaultValue={10} className="bg-zinc-900 border-zinc-800" />
          </div>
          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Input placeholder="Giveaway, partner, etc." className="bg-zinc-900 border-zinc-800" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="gradient">Generate</Button>
        </div>
      </Card>

      <Card className="overflow-hidden bg-zinc-900/40 border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800/40 text-zinc-400">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Plan / Cycle</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Issued</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium">By</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.code} className="border-t border-zinc-800">
                <td className="px-4 py-3 font-mono text-xs">{c.code}</td>
                <td className="px-4 py-3">
                  {c.plan} · {c.cycle}
                </td>
                <td className="px-4 py-3">{c.duration}d</td>
                <td className="px-4 py-3">
                  <Badge variant={c.redeemed ? 'success' : 'soft'}>
                    {c.redeemed ? 'Redeemed' : 'Available'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-zinc-400">{formatDate(c.issued, locale)}</td>
                <td className="px-4 py-3 text-zinc-400">{formatDate(c.expires, locale)}</td>
                <td className="px-4 py-3 text-zinc-400">{c.issuedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
