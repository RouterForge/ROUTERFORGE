import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/shared/logo';
import { LocaleSwitcher } from '@/components/shared/locale-switcher';
import { ThemeToggle } from '@/components/shared/theme-toggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh grid lg:grid-cols-2">
      <div className="hidden lg:flex relative bg-card border-r border-border/60 p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 -z-10 dot-pattern opacity-30" />
        <div
          aria-hidden
          className="absolute -top-40 -left-20 -z-10 h-[40rem] w-[40rem] rounded-full gradient-brand opacity-20 blur-3xl"
        />
        <Link href="/">
          <Logo />
        </Link>
        <div>
          <blockquote className="text-2xl font-display leading-snug max-w-md">
            “Stop juggling provider keys. RouterForge gives our team one gateway to every
            frontier model — with the analytics our finance team actually wants.”
          </blockquote>
          <div className="mt-4 text-sm text-muted-foreground">— Lead Engineer at a YC SaaS</div>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-4">
          <Link href="/" className="lg:hidden">
            <Logo />
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <LocaleSwitcher compact />
            <ThemeToggle />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
