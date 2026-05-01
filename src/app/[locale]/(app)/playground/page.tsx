import { setRequestLocale } from 'next-intl/server';
import { PlaygroundView } from '@/components/playground/playground-view';

export default async function PlaygroundPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PlaygroundView />;
}
