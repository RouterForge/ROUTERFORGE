import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ContactForm } from '@/components/marketing/contact-form';
import { Card } from '@/components/ui/card';
import { siteConfig } from '@/lib/site';
import { Mail, MessageSquare, Github } from 'lucide-react';

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'contact' });
  return (
    <div className="container-page max-w-5xl py-14">
      <h1 className="font-display text-4xl font-bold tracking-tight">{t('title')}</h1>
      <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <ContactForm />
        </Card>
        <div className="space-y-3">
          <Card className="p-6">
            <Mail className="h-5 w-5 text-primary" />
            <div className="mt-2 font-semibold">Email</div>
            <a className="text-sm text-primary underline" href={`mailto:${siteConfig.supportEmail}`}>
              {siteConfig.supportEmail}
            </a>
          </Card>
          <Card className="p-6">
            <MessageSquare className="h-5 w-5 text-primary" />
            <div className="mt-2 font-semibold">In-app support</div>
            <p className="text-sm text-muted-foreground">
              Logged-in users can open a ticket from the dashboard.
            </p>
          </Card>
          <Card className="p-6">
            <Github className="h-5 w-5 text-primary" />
            <div className="mt-2 font-semibold">Open source</div>
            <p className="text-sm text-muted-foreground">
              Adapters and SDKs live on GitHub.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
