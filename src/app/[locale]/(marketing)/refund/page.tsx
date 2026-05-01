import { setRequestLocale } from 'next-intl/server';
import { LegalPage } from '@/components/marketing/legal-page';

export default async function RefundPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <LegalPage title="Refund Policy">
      <p>
        We want you to be confident that RouterForge is the right fit for your team.
        This Refund Policy explains when and how refunds may be issued.
      </p>
      <h2>Eligibility</h2>
      <ul>
        <li>Refund requests must be submitted within 14 days of the charge.</li>
        <li>Refunds typically apply to first-time monthly or yearly subscriptions.</li>
        <li>Daily and weekly plans are generally non-refundable.</li>
        <li>Crypto and on-chain payments may be refunded as service credits.</li>
      </ul>
      <h2>How to request</h2>
      <p>
        Open a support ticket from your dashboard or email our support team. We aim to
        respond within two business days.
      </p>
      <h2>Discretionary refunds</h2>
      <p>
        We may issue partial or full refunds at our discretion, for example after major
        service incidents.
      </p>
    </LegalPage>
  );
}
