'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Copy, Trash2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDate, maskKey } from '@/lib/utils';
import type { ApiKeyListRow } from '@/services/api-keys';

interface Props {
  keys: ApiKeyListRow[];
}

export function ApiKeysView({ keys }: Props) {
  const t = useTranslations('settings');
  const [name, setName] = React.useState('My app');
  const [open, setOpen] = React.useState(false);
  const [created, setCreated] = React.useState<{ full: string; name: string } | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function create() {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim() || 'My app');
      const res = await fetch('/api/keys/create', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.full) {
        toast.error(data?.error ?? 'Could not create key');
        return;
      }
      setCreated({ full: data.full, name: data.name });
      setName('My app');
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    if (!confirm('Revoke this API key? Apps using it will stop working immediately.')) return;
    const fd = new FormData();
    fd.append('id', id);
    const res = await fetch('/api/keys/revoke', { method: 'POST', body: fd });
    if (res.ok) {
      toast.success('Key revoked');
      // Refresh the server-rendered list
      window.location.reload();
    } else {
      toast.error('Could not revoke');
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{t('apiKeys')}</h1>
          <p className="text-muted-foreground">
            Programmatic access to RouterForge. Treat keys like passwords.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button variant="gradient" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> {t('newKey')}
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('newKey')}</DialogTitle>
              <DialogDescription>
                Give your key a memorable name. The full secret is shown only once.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="key-name">{t('keyName')}</Label>
              <Input id="key-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
                Cancel
              </Button>
              <Button variant="gradient" onClick={create} disabled={busy}>
                {busy ? '…' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {created && (
        <Card className="p-6 border-primary/40">
          <div className="font-semibold">Your new key</div>
          <p className="text-sm text-muted-foreground mt-1">
            Copy this now — it will not be shown again.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-muted px-3 py-2 text-sm font-mono">
              {created.full}
            </code>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(created.full);
                toast.success('Copied');
              }}
            >
              <Copy className="h-4 w-4" /> Copy
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setCreated(null);
                window.location.reload();
              }}
            >
              Done
            </Button>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        {keys.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No keys yet. Create your first key to start making API calls.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Key</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Last used</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-t border-border/60">
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-muted-foreground" />
                      {k.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{maskKey(k.prefix + '…')}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(k.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {k.lastUsedAt ? formatDate(k.lastUsedAt) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {k.revoked ? (
                      <Badge variant="destructive">Revoked</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-end">
                    {!k.revoked && (
                      <Button variant="ghost" size="sm" onClick={() => revoke(k.id)}>
                        <Trash2 className="h-4 w-4" /> Revoke
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
