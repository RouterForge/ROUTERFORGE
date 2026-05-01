import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { SignInForm } from '@/components/auth/sign-in-form';

export default async function SignInPage({
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
        <h1 className="font-display text-3xl font-bold tracking-tight">{t('signInTitle')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('signInSubtitle')}</p>
      </div>
      <SignInForm />
      <p className="text-center text-sm text-muted-foreground">
        {t('noAccount')}{' '}
        <Link href="/sign-up" className="text-primary underline">
          {t('signUpTitle')}
        </Link>
      </p>
    </div>
  );
}
