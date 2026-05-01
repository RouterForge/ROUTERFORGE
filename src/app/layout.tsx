import type { Metadata } from 'next';
import './globals.css';

// The locale-specific layout handles html/body and providers.
// This root layout is a pass-through required by Next.js.
export const metadata: Metadata = {
  title: {
    default: 'RouterForge',
    template: '%s · RouterForge',
  },
  description:
    'RouterForge — premium multi-model AI API subscription platform. Access OpenAI, Claude, Gemini, and open-source models through a single reliable gateway.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
