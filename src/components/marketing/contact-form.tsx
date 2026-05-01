'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export function ContactForm() {
  const t = useTranslations('contact');
  const [busy, setBusy] = React.useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        await new Promise((r) => setTimeout(r, 700));
        toast.success(t('sent'));
        (e.currentTarget as HTMLFormElement).reset();
        setBusy(false);
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">{t('nameLabel')}</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t('emailLabel')}</Label>
          <Input id="email" name="email" type="email" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject">{t('subjectLabel')}</Label>
        <Input id="subject" name="subject" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">{t('messageLabel')}</Label>
        <Textarea id="message" name="message" rows={6} required />
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="gradient" disabled={busy}>
          {busy ? '…' : t('send')}
        </Button>
      </div>
    </form>
  );
}
