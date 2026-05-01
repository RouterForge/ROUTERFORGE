import { setRequestLocale } from 'next-intl/server';
import { LegalPage } from '@/components/marketing/legal-page';

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <LegalPage title="Terms of Service">
      <p>
        Welcome to RouterForge. By creating an account or using the service you agree to these
        Terms of Service. Please read them carefully — they govern your use of our website,
        API, dashboard, and related services.
      </p>
      <h2>1. Accounts</h2>
      <p>
        You must provide accurate information and keep your credentials secure. You are
        responsible for all activity under your account, including any API keys you generate.
      </p>
      <h2>2. Subscriptions</h2>
      <p>
        RouterForge offers time-based subscriptions. Subscriptions begin on the start date
        shown at checkout and end automatically at the end of the paid period unless renewed.
      </p>
      <h2>3. Acceptable Use</h2>
      <p>
        You agree to use RouterForge only for lawful purposes and in compliance with our
        Acceptable Use Policy. We may suspend access if we detect abuse, fraud, or violations.
      </p>
      <h2>4. Service availability</h2>
      <p>
        We work to keep RouterForge highly available, but the service is provided "as is" and
        may experience occasional disruptions, including those of upstream providers.
      </p>
      <h2>5. Intellectual property</h2>
      <p>
        You retain rights to your prompts and outputs. We retain rights to our software,
        designs, brand, and aggregated, anonymized usage statistics.
      </p>
      <h2>6. Termination</h2>
      <p>
        You may stop using the service at any time. We may terminate accounts that violate
        these Terms or our policies.
      </p>
      <h2>7. Changes</h2>
      <p>We may update these Terms. Material changes will be communicated by email or in-app.</p>
    </LegalPage>
  );
}
