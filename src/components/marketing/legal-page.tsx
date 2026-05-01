import { useTranslations } from 'next-intl';
import { siteConfig } from '@/lib/site';

export function LegalPage({
  title,
  lastUpdated = '2025-01-01',
  children,
}: {
  title: string;
  lastUpdated?: string;
  children: React.ReactNode;
}) {
  const t = useTranslations('legal');
  return (
    <article className="container-page max-w-3xl py-14">
      <div className="mb-2 text-sm text-muted-foreground">
        {t('lastUpdated')}: {lastUpdated}
      </div>
      <h1 className="font-display text-4xl font-bold tracking-tight mb-2">{title}</h1>
      <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning my-6">
        {t('placeholderNotice')}
      </div>
      <div className="prose-style space-y-4 text-foreground/90 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-6 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_a]:text-primary [&_a]:underline">
        {children}
      </div>
      <div className="mt-12 text-sm text-muted-foreground">
        Questions? Contact us at{' '}
        <a className="text-primary underline" href={`mailto:${siteConfig.supportEmail}`}>
          {siteConfig.supportEmail}
        </a>
        .
      </div>
    </article>
  );
}
