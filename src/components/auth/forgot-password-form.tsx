'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ForgotPasswordForm() {
  const t = useTranslations('auth');
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  if (sent) {
    return (
      <div className="rounded-lg border border-success/40 bg-success/10 p-4 text-sm text-success">
        Check your inbox for a reset link.
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        await fetch('/api/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email: new FormData(e.currentTarget).get('email') }),
          headers: { 'content-type': 'application/json' },
        });
        setBusy(false);
        setSent(true);
        toast.success('If that email exists, a reset link is on its way.');
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="email">{t('emailLabel')}</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <Button type="submit" className="w-full" variant="gradient" disabled={busy}>
        {busy ? '…' : t('continue')}
      </Button>
    </form>
  );
}
