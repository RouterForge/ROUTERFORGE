import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'auth' });
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight">{t('resetTitle')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Choose a new password.</p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
