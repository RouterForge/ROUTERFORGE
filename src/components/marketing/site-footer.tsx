import { useTranslations } from 'next-intl';
import { Github, Twitter } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/shared/logo';
import { LocaleSwitcher } from '@/components/shared/locale-switcher';
import { siteConfig } from '@/lib/site';

export function SiteFooter() {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');

  const groups = [
    {
      title: t('product'),
      links: [
        { href: '/pricing', label: nav('pricing') },
        { href: '/playground', label: nav('playground') },
        { href: '/chat', label: nav('chat') },
        { href: '/docs', label: nav('docs') },
        { href: '/status', label: nav('status') },
      ],
    },
    {
      title: t('company'),
      links: [
        { href: '/about', label: t('about') },
        { href: '/contact', label: t('contact') },
        { href: '/blog', label: nav('blog') },
      ],
    },
    {
      title: t('legal'),
      links: [
        { href: '/terms', label: t('terms') },
        { href: '/service-terms', label: t('serviceTerms') },
        { href: '/refund', label: t('refund') },
        { href: '/privacy', label: t('privacy') },
        { href: '/security', label: t('security') },
        { href: '/acceptable-use', label: t('aup') },
        { href: '/abuse', label: t('abuse') },
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t border-border/60 bg-background">
      <div className="container-page py-12 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
        <div className="col-span-2 space-y-4">
          <Logo />
          <p className="text-sm text-muted-foreground max-w-xs">
            One gateway to every frontier AI model. Built for developers, teams, and power users.
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={siteConfig.github}
              aria-label="GitHub"
              className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <Github className="h-4 w-4" />
            </Link>
            <Link
              href={`https://twitter.com/${siteConfig.twitter.replace('@', '')}`}
              aria-label="Twitter"
              className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <Twitter className="h-4 w-4" />
            </Link>
          </div>
        </div>
        {groups.map((group) => (
          <div key={group.title}>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </div>
            <ul className="space-y-2">
              {group.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href as any}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60">
        <div className="container-page py-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {siteConfig.year} RouterForge. {t('rights')}
          </p>
          <LocaleSwitcher />
        </div>
      </div>
    </footer>
  );
}
