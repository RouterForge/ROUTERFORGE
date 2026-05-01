import { setRequestLocale } from 'next-intl/server';
import { LegalPage } from '@/components/marketing/legal-page';

export default async function ServiceTermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <LegalPage title="Service Terms">
      <p>
        These Service Terms supplement the main Terms of Service for specific RouterForge
        services, including the API gateway, dashboard, and chat interface.
      </p>
      <h2>API gateway</h2>
      <ul>
        <li>Requests are routed through CLIProxyAPI Plus to upstream providers.</li>
        <li>Rate limits and quotas apply per plan and per API key.</li>
        <li>Streaming responses are supported on most models.</li>
      </ul>
      <h2>Dashboard & analytics</h2>
      <ul>
        <li>Aggregated usage data is shown to help you optimize your spend.</li>
        <li>Cost comparisons against direct provider pricing are estimates only.</li>
      </ul>
      <h2>Chat & playground</h2>
      <ul>
        <li>Chats and playground prompts may be retained for your own history.</li>
        <li>Retention windows are configurable in account settings.</li>
      </ul>
    </LegalPage>
  );
}
