import { setRequestLocale } from 'next-intl/server';
import { LegalPage } from '@/components/marketing/legal-page';

export default async function SecurityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <LegalPage title="Security Policy">
      <p>
        RouterForge is built with security as a foundation. We follow industry best
        practices and maintain rigorous internal controls.
      </p>
      <h2>Encryption</h2>
      <ul>
        <li>TLS 1.2+ for all traffic.</li>
        <li>At-rest encryption for credentials and sensitive metadata.</li>
        <li>Secrets stored in a managed vault, never in source.</li>
      </ul>
      <h2>Access control</h2>
      <ul>
        <li>Role-based access control (USER, ADMIN, SUPER_ADMIN).</li>
        <li>Admin actions are append-only logged and reviewable.</li>
        <li>2FA available for all accounts; required for admin roles.</li>
      </ul>
      <h2>Reporting vulnerabilities</h2>
      <p>
        Please report security concerns to security@routerforge.example. We aim to
        acknowledge reports within 48 hours.
      </p>
    </LegalPage>
  );
}
