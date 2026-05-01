import { setRequestLocale } from 'next-intl/server';
import { ApiKeysView } from '@/components/app/api-keys-view';

export default async function ApiKeysPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ApiKeysView />;
}
