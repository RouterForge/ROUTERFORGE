import { setRequestLocale } from 'next-intl/server';
import { LegalPage } from '@/components/marketing/legal-page';

export default async function AupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <LegalPage title="Acceptable Use Policy">
      <p>
        RouterForge is a shared platform. To keep it reliable and safe, we ask all users
        to follow this policy. Violations may lead to suspension or termination.
      </p>
      <h2>You may not use RouterForge to</h2>
      <ul>
        <li>Generate content that exploits or endangers minors.</li>
        <li>Create malware, phishing tools, or material designed to defraud.</li>
        <li>Impersonate real people or organizations to deceive others.</li>
        <li>Bulk-harvest credentials, scrape protected data, or evade rate limits.</li>
        <li>Violate any applicable law or third-party rights.</li>
      </ul>
      <h2>Provider-specific rules</h2>
      <p>
        Upstream providers (OpenAI, Anthropic, Google, etc.) have their own usage policies
        which apply when their models are routed through RouterForge.
      </p>
    </LegalPage>
  );
}
