import { setRequestLocale } from 'next-intl/server';
import { LegalPage } from '@/components/marketing/legal-page';

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <LegalPage title="Privacy Policy">
      <p>
        Privacy is a first-class concern for RouterForge. This Privacy Policy explains
        what data we collect, how we use it, and your rights.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Account info: email, name, hashed password, locale, theme.</li>
        <li>Subscription &amp; payment metadata (we never store full card numbers).</li>
        <li>Usage events: model used, request count, latency, token counts, timestamps.</li>
        <li>Optional: chat conversations, playground prompts (configurable retention).</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To deliver and improve the service.</li>
        <li>To enforce limits, prevent abuse, and meet legal obligations.</li>
        <li>To show your usage and savings in the dashboard.</li>
      </ul>
      <h2>What we don't do</h2>
      <ul>
        <li>We do not train AI models on your prompts or completions.</li>
        <li>We do not sell your data.</li>
      </ul>
      <h2>Your rights</h2>
      <p>
        You can export, delete, or anonymize your data at any time from Settings, or by
        contacting support.
      </p>
    </LegalPage>
  );
}
