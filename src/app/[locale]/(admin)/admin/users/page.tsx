import { setRequestLocale } from 'next-intl/server';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Ban } from 'lucide-react';

const sample = Array.from({ length: 16 }).map((_, i) => ({
  id: `usr_${(1000 + i).toString(36)}`,
  email: `user${i + 1}@routerforge.example`,
  plan: ['Open Source', 'Gemini', 'GPT', 'Claude', 'Bundle'][i % 5],
  status: ['Active', 'Active', 'Expired', 'Active', 'Paused'][i % 5],
  rpm: 12 + ((i * 7) % 80),
  rpd: 200 + ((i * 99) % 4000),
  joined: new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10),
}));

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <h1 className="font-display text-3xl font-bold tracking-tight">Users</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search by email, id, key, plan…"
              className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 w-80"
            />
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden bg-zinc-900/40 border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800/40 text-zinc-400">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">RPM</th>
              <th className="px-4 py-3 font-medium">RPD</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {sample.map((u) => (
              <tr key={u.id} className="border-t border-zinc-800">
                <td className="px-4 py-3">
                  <div className="font-medium">{u.email}</div>
                  <div className="text-xs text-zinc-400 font-mono">{u.id}</div>
                </td>
                <td className="px-4 py-3">{u.plan}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      u.status === 'Active'
                        ? 'success'
                        : u.status === 'Paused'
                        ? 'warning'
                        : 'destructive'
                    }
                  >
                    {u.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 tabular-nums">{u.rpm}</td>
                <td className="px-4 py-3 tabular-nums">{u.rpd}</td>
                <td className="px-4 py-3 text-zinc-400">{u.joined}</td>
                <td className="px-4 py-3 text-end">
                  <Button variant="ghost" size="sm">
                    <Ban className="h-4 w-4" /> Suspend
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
