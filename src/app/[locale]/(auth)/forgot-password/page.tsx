import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default async function ForgotPasswordPage({
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
        <p className="mt-2 text-sm text-muted-foreground">{t('resetSubtitle')}</p>
      </div>
      <ForgotPasswordForm />
      <p className="text-center text-sm">
        <Link href="/sign-in" className="text-primary underline">
          ← {t('signInTitle')}
        </Link>
      </p>
    </div>
  );
}
