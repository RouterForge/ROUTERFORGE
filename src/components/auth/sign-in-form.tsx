'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export function SignInForm() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const fd = new FormData(e.currentTarget);
        const res = await fetch('/api/auth/sign-in', {
          method: 'POST',
          body: JSON.stringify({
            email: fd.get('email'),
            password: fd.get('password'),
          }),
          headers: { 'content-type': 'application/json' },
        });
        setBusy(false);
        if (res.ok) {
          toast.success('Welcome back');
          router.push('/dashboard');
        } else {
          const data = await res.json().catch(() => ({}));
          toast.error(data?.error ?? 'Could not sign in');
        }
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="email">{t('emailLabel')}</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t('passwordLabel')}</Label>
          <Link href="/forgot-password" className="text-xs text-primary underline">
            {t('forgot')}
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      <Button type="submit" className="w-full" variant="gradient" size="lg" disabled={busy}>
        {busy ? '…' : tc('signIn')}
      </Button>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Separator className="flex-1" />
        <span>{t('orSocial')}</span>
        <Separator className="flex-1" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" disabled>
          GitHub
        </Button>
        <Button type="button" variant="outline" disabled>
          Google
        </Button>
      </div>
      <p className="text-xs text-center text-muted-foreground">{t('termsAgreement')}</p>
    </form>
  );
}
