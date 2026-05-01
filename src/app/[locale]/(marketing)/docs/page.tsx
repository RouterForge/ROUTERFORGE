import { setRequestLocale } from 'next-intl/server';
import { Card } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { ArrowRight, Code2, KeyRound, MessageSquare, Boxes, Gauge } from 'lucide-react';

const sections = [
  {
    icon: KeyRound,
    title: 'Authentication',
    desc: 'Generate an API key, set up environment variables, and verify your access.',
    href: '/settings',
  },
  {
    icon: Code2,
    title: 'Quickstart: cURL',
    desc: 'Send your first request from the command line to /v1/chat/completions.',
    href: '/playground',
  },
  {
    icon: MessageSquare,
    title: 'Chat completions',
    desc: 'Streaming, tool use, vision input, and conversation patterns across providers.',
    href: '/playground',
  },
  {
    icon: Boxes,
    title: 'Models & families',
    desc: 'Browse models in your plan, with context windows, capabilities, and pricing.',
    href: '/pricing',
  },
  {
    icon: Gauge,
    title: 'Rate limits & quotas',
    desc: 'How RPM, RPT, and RPD limits are computed and how to handle 429s.',
    href: '/dashboard',
  },
];

export default async function DocsLanding({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="container-page max-w-5xl py-14">
      <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
        Developer documentation
      </h1>
      <p className="mt-3 text-muted-foreground max-w-2xl">
        OpenAI-compatible endpoints, typed SDKs, and modular adapters. Below are the
        starting points — full reference is being expanded.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.title} href={s.href as any} className="group">
              <Card className="p-6 h-full hover:border-primary/40 transition-colors">
                <Icon className="h-6 w-6 text-primary" />
                <div className="mt-3 font-semibold flex items-center gap-1">
                  {s.title}
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="mt-10 p-6">
        <h2 className="font-display text-xl font-semibold">Base URL</h2>
        <pre className="mt-3 rounded-lg bg-muted p-3 text-sm overflow-x-auto"><code>{`https://api.routerforge.example/v1`}</code></pre>
        <h2 className="mt-6 font-display text-xl font-semibold">Send a request</h2>
        <pre className="mt-3 rounded-lg bg-muted p-3 text-sm overflow-x-auto"><code>{`curl https://api.routerforge.example/v1/chat/completions \\
  -H "Authorization: Bearer $ROUTERFORGE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'`}</code></pre>
      </Card>
    </div>
  );
}
