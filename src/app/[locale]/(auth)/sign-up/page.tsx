import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { SignUpForm } from '@/components/auth/sign-up-form';

export default async function SignUpPage({
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
        <h1 className="font-display text-3xl font-bold tracking-tight">{t('signUpTitle')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('signUpSubtitle')}</p>
      </div>
      <SignUpForm />
      <p className="text-center text-sm text-muted-foreground">
        {t('haveAccount')}{' '}
        <Link href="/sign-in" className="text-primary underline">
          {t('signInTitle')}
        </Link>
      </p>
    </div>
  );
}
