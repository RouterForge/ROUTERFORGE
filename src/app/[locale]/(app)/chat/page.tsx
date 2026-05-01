import { setRequestLocale } from 'next-intl/server';
import { ChatView } from '@/components/chat/chat-view';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ChatView />;
}
