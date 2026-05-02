'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function sanitizeNext(v: string | null): string {
  if (!v || !v.startsWith('/') || v.startsWith('//')) return '/dashboard';
  return v;
}

export function SignUpForm() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const router = useRouter();
  const params = useSearchParams();
  const next = sanitizeNext(params.get('next'));
  const [busy, setBusy] = React.useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const fd = new FormData(e.currentTarget);
        const res = await fetch('/api/auth/sign-up', {
          method: 'POST',
          body: JSON.stringify({
            name: fd.get('name'),
            email: fd.get('email'),
            password: fd.get('password'),
          }),
          headers: { 'content-type': 'application/json' },
        });
        setBusy(false);
        if (res.ok) {
          toast.success('Account created. Welcome!');
          router.push(next as any);
        } else {
          const data = await res.json().catch(() => ({}));
          toast.error(data?.error ?? 'Could not create account');
        }
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="name">{t('nameLabel')}</Label>
        <Input id="name" name="name" required autoComplete="name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t('emailLabel')}</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t('passwordLabel')}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <Button type="submit" className="w-full" variant="gradient" size="lg" disabled={busy}>
        {busy ? '…' : tc('signUp')}
      </Button>
      <p className="text-xs text-center text-muted-foreground">{t('termsAgreement')}</p>
    </form>
  );
}
