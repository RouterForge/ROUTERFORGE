'use client';

import * as React from 'react';
import { usePathname, Link } from '@/i18n/navigation';
import {
  LayoutDashboard,
  Beaker,
  MessagesSquare,
  CreditCard,
  Settings,
  KeyRound,
  Activity,
  LifeBuoy,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Logo } from '@/components/shared/logo';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function AppSidebar() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/playground', label: t('playground'), icon: Beaker },
    { href: '/chat', label: t('chat'), icon: MessagesSquare },
    { href: '/billing', label: t('billing'), icon: CreditCard },
    { href: '/settings', label: t('settings'), icon: Settings },
    { href: '/settings/api-keys', label: 'API keys', icon: KeyRound },
  ];

  const secondary: NavItem[] = [
    { href: '/status', label: t('status'), icon: Activity },
    { href: '/contact', label: 'Support', icon: LifeBuoy },
  ];

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-e border-border/60 bg-card/40">
      <div className="p-4 border-b border-border/60">
        <Link href="/">
          <Logo />
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href as any}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border/60 space-y-1">
        {secondary.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href as any}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
