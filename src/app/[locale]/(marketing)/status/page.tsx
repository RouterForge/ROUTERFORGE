import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Card } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

const components = [
  { id: 'gateway', label: 'API Gateway' },
  { id: 'openai', label: 'OpenAI / GPT routing' },
  { id: 'claude', label: 'Anthropic Claude routing' },
  { id: 'gemini', label: 'Google Gemini routing' },
  { id: 'oss', label: 'Open-source model routing' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'billing', label: 'Billing & payments' },
];

export default async function StatusPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'status' });
  return (
    <div className="container-page max-w-3xl py-14">
      <h1 className="font-display text-4xl font-bold tracking-tight">{t('title')}</h1>
      <Card className="mt-6 p-6 border-success/40 bg-success/5">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-success" />
          <div>
            <div className="font-semibold">{t('operational')}</div>
            <div className="text-sm text-muted-foreground">
              Last checked: {new Date().toLocaleString(locale)}
            </div>
          </div>
        </div>
      </Card>

      <h2 className="mt-10 font-display text-xl font-semibold">{t('components')}</h2>
      <Card className="mt-3 divide-y divide-border/60">
        {components.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-4">
            <span className="font-medium">{c.label}</span>
            <span className="inline-flex items-center gap-1.5 text-success text-sm">
              <span className="h-2 w-2 rounded-full bg-success" />
              Operational
            </span>
          </div>
        ))}
      </Card>

      <p className="mt-6 text-xs text-muted-foreground">
        Status data is illustrative. In production, wire this page to your incident
        tracker (Statuspage, Better Stack, etc.).
      </p>
    </div>
  );
}
