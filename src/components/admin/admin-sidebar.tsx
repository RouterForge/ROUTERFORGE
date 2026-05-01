'use client';

import {
  LayoutDashboard,
  Users,
  CreditCard,
  KeyRound,
  Cpu,
  ShieldAlert,
  ScrollText,
  LifeBuoy,
  Activity,
  Boxes,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link, usePathname } from '@/i18n/navigation';
import { Logo } from '@/components/shared/logo';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function AdminSidebar() {
  const t = useTranslations('admin');
  const pathname = usePathname();

  const items = [
    { href: '/admin', label: t('overview'), icon: LayoutDashboard },
    { href: '/admin/users', label: t('users'), icon: Users },
    { href: '/admin/subscriptions', label: t('subscriptions'), icon: CreditCard },
    { href: '/admin/payments', label: t('payments'), icon: CreditCard },
    { href: '/admin/keys', label: t('keys'), icon: KeyRound },
    { href: '/admin/providers', label: t('providers'), icon: Cpu },
    { href: '/admin/abuse', label: t('abuse'), icon: ShieldAlert },
    { href: '/admin/logs', label: t('logs'), icon: ScrollText },
    { href: '/admin/tickets', label: t('tickets'), icon: LifeBuoy },
    { href: '/admin/system', label: t('system'), icon: Activity },
  ];

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-e border-border/60 bg-zinc-950/95 dark:bg-zinc-950/95 text-zinc-100">
      <div className="p-4 border-b border-zinc-800/60 flex items-center justify-between">
        <Link href="/admin">
          <Logo />
        </Link>
        <Badge variant="destructive" className="text-[10px] uppercase">
          Admin
        </Badge>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href as any}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-zinc-800/80 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-zinc-800/60">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
        >
          <Boxes className="h-4 w-4" />
          Back to app
        </Link>
      </div>
    </aside>
  );
}
