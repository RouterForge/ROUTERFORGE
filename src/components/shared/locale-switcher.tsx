'use client';

import * as React from 'react';
import { Globe, Check } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { locales, localeLabels, type Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';

export function LocaleSwitcher({ compact = false }: { compact?: boolean }) {
  const activeLocale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const [isPending, startTransition] = React.useTransition();

  const change = React.useCallback(
    (nextLocale: Locale) => {
      startTransition(() => {
        router.replace(
          // @ts-expect-error dynamic route params typed as any by next-intl
          { pathname, params },
          { locale: nextLocale },
        );
      });
    },
    [router, pathname, params],
  );

  const current = localeLabels[activeLocale];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? 'icon' : 'sm'}
          className={cn(compact && 'h-9 w-9', 'gap-2')}
          disabled={isPending}
          aria-label="Change language"
        >
          <Globe className="h-4 w-4" />
          {!compact && <span className="text-sm">{current?.native ?? activeLocale}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 w-56 overflow-y-auto">
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {locales.map((code) => {
          const info = localeLabels[code];
          const isActive = code === activeLocale;
          return (
            <DropdownMenuItem
              key={code}
              onClick={() => change(code)}
              className="flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <span className="text-base leading-none">{info.flag}</span>
                <span className="text-sm">{info.native}</span>
                <span className="text-xs text-muted-foreground">{info.english}</span>
              </span>
              {isActive && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
