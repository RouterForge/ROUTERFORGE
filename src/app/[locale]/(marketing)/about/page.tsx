import { setRequestLocale } from 'next-intl/server';
import { Boxes, Globe2, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="container-page max-w-4xl py-14">
      <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
        Premium AI infrastructure for everyone.
      </h1>
      <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
        RouterForge is built by a small, opinionated team obsessed with shipping reliable,
        affordable, multilingual access to every major AI model. We believe model choice
        should not be a vendor lock-in problem.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        <Card className="p-6">
          <Boxes className="h-6 w-6 text-primary" />
          <div className="mt-3 font-semibold">Modular by design</div>
          <p className="mt-1 text-sm text-muted-foreground">
            New providers are added through clean adapter modules — no rewrites required.
          </p>
        </Card>
        <Card className="p-6">
          <Globe2 className="h-6 w-6 text-primary" />
          <div className="mt-3 font-semibold">Built for the world</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Sixteen languages on day one, with full RTL and locale-aware formatting.
          </p>
        </Card>
        <Card className="p-6">
          <Sparkles className="h-6 w-6 text-primary" />
          <div className="mt-3 font-semibold">Crafted, not generated</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Every screen is hand-built for clarity, speed, and trust.
          </p>
        </Card>
      </div>

      <h2 className="mt-16 font-display text-2xl font-bold">Our principles</h2>
      <ul className="mt-4 space-y-2 list-disc pl-6 text-muted-foreground">
        <li>Transparency over hype.</li>
        <li>Clear pricing, no surprise bills.</li>
        <li>Privacy by default — your prompts are not training data.</li>
        <li>Reliability earned, not promised.</li>
      </ul>
    </div>
  );
}
