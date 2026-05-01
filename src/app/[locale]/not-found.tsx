import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const t = useTranslations('notFound');
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center px-4">
      <div className="text-7xl font-display font-bold gradient-text">404</div>
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <p className="text-muted-foreground max-w-md">{t('subtitle')}</p>
      <Button asChild variant="gradient">
        <Link href="/">{t('cta')}</Link>
      </Button>
    </div>
  );
}
