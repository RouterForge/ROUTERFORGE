import { setRequestLocale } from 'next-intl/server';
import { ApiKeysView } from '@/components/app/api-keys-view';
import { listApiKeysForCurrentUser } from '@/services/api-keys';

export default async function ApiKeysPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const keys = await listApiKeysForCurrentUser();
  return <ApiKeysView keys={keys} />;
}
