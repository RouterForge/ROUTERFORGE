import { setRequestLocale } from 'next-intl/server';
import { LegalPage } from '@/components/marketing/legal-page';

export default async function AbusePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <LegalPage title="Abuse Policy">
      <p>
        We monitor for abuse and act quickly to keep RouterForge safe. This page
        explains what we look for, how we act, and how to report concerns.
      </p>
      <h2>Detection signals</h2>
      <ul>
        <li>Sudden spikes in requests per minute or token burn.</li>
        <li>Abnormal patterns of failed requests or unusual model mixes.</li>
        <li>Reports from upstream providers about policy-violating prompts.</li>
        <li>Manual flags from operators after content review.</li>
      </ul>
      <h2>Our response</h2>
      <ul>
        <li>Soft warning + rate-limit tightening for low-severity flags.</li>
        <li>Temporary suspension for high-severity flags pending review.</li>
        <li>Account termination for confirmed violations.</li>
        <li>Cooperation with lawful requests from authorities.</li>
      </ul>
      <h2>Report abuse</h2>
      <p>
        Email abuse@routerforge.example with details. We treat reports confidentially.
      </p>
    </LegalPage>
  );
}
