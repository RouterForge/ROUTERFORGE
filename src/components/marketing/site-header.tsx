'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/logo';
import { LocaleSwitcher } from '@/components/shared/locale-switcher';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const nav = [
    { href: '/pricing', label: t('pricing') },
    { href: '/playground', label: t('playground') },
    { href: '/chat', label: t('chat') },
    { href: '/docs', label: t('docs') },
    { href: '/blog', label: t('blog') },
    { href: '/status', label: t('status') },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all',
        scrolled
          ? 'border-b border-border/60 bg-background/80 backdrop-blur-md'
          : 'border-b border-transparent',
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="RouterForge home" className="shrink-0">
            <Logo />
          </Link>
          <nav className="hidden lg:flex items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1">
            <LocaleSwitcher compact />
            <ThemeToggle />
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">{tc('signIn')}</Link>
            </Button>
            <Button asChild variant="gradient" size="sm">
              <Link href="/sign-up">{tc('getStarted')}</Link>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border/60 bg-background">
          <div className="container-page flex flex-col py-4 gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <div className="flex items-center gap-2 pt-3">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/sign-in">{tc('signIn')}</Link>
              </Button>
              <Button asChild variant="gradient" size="sm">
                <Link href="/sign-up">{tc('getStarted')}</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
