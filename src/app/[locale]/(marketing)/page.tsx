import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Shield, Zap, Globe2, Boxes, Sparkles, Check, LineChart } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionItem,
  AccordionContent,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { MODEL_FAMILIES } from '@/lib/models';
import { PLANS } from '@/lib/plans';
import { cn } from '@/lib/utils';

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const tc = await getTranslations('common');

  const how = [
    { key: 'one', icon: Sparkles },
    { key: 'two', icon: Zap },
    { key: 'three', icon: Boxes },
  ] as const;

  const benefits = [
    { key: 'developers', icon: Boxes },
    { key: 'scale', icon: LineChart },
    { key: 'transparent', icon: Shield },
    { key: 'reliable', icon: Globe2 },
  ] as const;

  const trust = [
    { key: 'encryption', icon: Shield },
    { key: 'privacy', icon: Globe2 },
    { key: 'audit', icon: LineChart },
    { key: 'compliance', icon: Check },
  ] as const;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 dot-pattern opacity-40" />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 -z-10 h-[40rem] bg-radial-fade"
        />
        <div className="container-page pt-20 pb-16 sm:pt-24 sm:pb-24 text-center">
          <Badge variant="gradient" className="mb-5 inline-flex">
            {t('heroEyebrow')}
          </Badge>
          <h1 className="mx-auto max-w-4xl font-display text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="gradient-text">{t('heroTitle')}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            {t('heroSubtitle')}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="xl" variant="gradient">
              <Link href="/sign-up">
                {t('heroPrimaryCta')} <ArrowRight className="ms-2" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link href="/pricing">{t('heroSecondaryCta')}</Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <BadgePill>{t('badges.uptime')}</BadgePill>
            <BadgePill>{t('badges.regions')}</BadgePill>
            <BadgePill>{t('badges.noVendor')}</BadgePill>
          </div>

          {/* Model logo row */}
          <div className="mt-14 rounded-2xl border border-border/60 bg-card/50 p-6 sm:p-8 max-w-4xl mx-auto">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4 text-center">
              {t('models.subtitle')}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(Object.keys(MODEL_FAMILIES) as Array<keyof typeof MODEL_FAMILIES>).map((id) => (
                <div
                  key={id}
                  className={cn(
                    'rounded-xl p-4 text-sm font-medium text-white shadow-md bg-gradient-to-br',
                    MODEL_FAMILIES[id].accent,
                  )}
                >
                  {MODEL_FAMILIES[id].label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MODELS */}
      <section className="container-page py-16 sm:py-24">
        <SectionHeading
          eyebrow={tc('all')}
          title={t('models.title')}
          subtitle={t('models.subtitle')}
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(MODEL_FAMILIES) as Array<keyof typeof MODEL_FAMILIES>).map((id) => (
            <Card key={id} className="p-6 hover:shadow-lg transition-shadow">
              <div
                className={cn('h-10 w-10 rounded-lg bg-gradient-to-br mb-4', MODEL_FAMILIES[id].accent)}
              />
              <div className="font-semibold">{MODEL_FAMILIES[id].label}</div>
              <p className="mt-2 text-sm text-muted-foreground">{MODEL_FAMILIES[id].blurb}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container-page py-16 sm:py-24">
        <SectionHeading title={t('how.title')} />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {how.map((s, i) => {
            const Icon = s.icon;
            return (
              <Card key={s.key} className="p-6 relative">
                <div className="absolute -top-3 left-6 rounded-full bg-primary text-primary-foreground h-7 w-7 flex items-center justify-center text-xs font-semibold shadow-md">
                  {i + 1}
                </div>
                <Icon className="h-8 w-8 text-primary mb-4" />
                <div className="font-semibold">{t(`how.steps.${s.key}.title`)}</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(`how.steps.${s.key}.desc`)}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="container-page py-16 sm:py-24">
        <SectionHeading title={t('benefits.title')} />
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <Card key={b.key} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{t(`benefits.items.${b.key}.title`)}</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t(`benefits.items.${b.key}.desc`)}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section className="container-page py-16 sm:py-24">
        <SectionHeading title="Pricing preview" subtitle={t('heroSubtitle')} />
        <div className="mt-10 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {PLANS.map((p) => (
            <Card
              key={p.id}
              className={cn(
                'p-6 relative flex flex-col',
                p.badge === 'best-value' && 'border-primary',
              )}
            >
              {p.badge && (
                <div className="absolute -top-3 right-6">
                  <Badge variant={p.badge === 'best-value' ? 'gradient' : 'default'}>
                    {p.badge === 'best-value' ? 'Best value' : 'Popular'}
                  </Badge>
                </div>
              )}
              <div className="font-semibold">{p.name}</div>
              <p className="mt-1 text-xs text-muted-foreground">{p.tagline}</p>
              <div className="mt-4 text-3xl font-bold">
                ${p.prices.monthly}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </div>
              <Button asChild variant="outline" className="mt-4">
                <Link href={`/pricing?plan=${p.id}`}>{tc('viewPricing')}</Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* TRUST */}
      <section className="container-page py-16 sm:py-24">
        <SectionHeading title={t('trust.title')} subtitle={t('trust.subtitle')} />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trust.map((b) => {
            const Icon = b.icon;
            return (
              <Card key={b.key} className="p-6">
                <Icon className="h-6 w-6 text-primary" />
                <div className="mt-3 font-semibold">{t(`trust.items.${b.key}.title`)}</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(`trust.items.${b.key}.desc`)}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="container-page py-16 sm:py-24 max-w-3xl">
        <SectionHeading title={t('faq.title')} />
        <Accordion type="single" collapsible className="mt-8">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <AccordionItem key={i} value={`q-${i}`}>
              <AccordionTrigger>{t(`faq.items.${i}.q`)}</AccordionTrigger>
              <AccordionContent>{t(`faq.items.${i}.a`)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="container-page pb-24 pt-12">
        <div className="rounded-3xl border border-border/60 bg-card overflow-hidden">
          <div className="p-8 sm:p-14 flex flex-col md:flex-row md:items-center md:justify-between gap-6 gradient-brand text-white">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold">{t('cta.title')}</h2>
              <p className="mt-2 opacity-90 max-w-2xl">{t('cta.subtitle')}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <Link href="/sign-up">{t('cta.primary')}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10"
              >
                <Link href="/contact">{t('cta.secondary')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function BadgePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1">
      <span className="h-1.5 w-1.5 rounded-full bg-success" />
      {children}
    </span>
  );
}

function SectionHeading({
  title,
  subtitle,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      {eyebrow && (
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{eyebrow}</div>
      )}
      <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
