import { setRequestLocale } from 'next-intl/server';
import { AppSidebar } from '@/components/app/app-sidebar';
import { AppTopbar } from '@/components/app/app-topbar';
import { getSessionUser } from '@/lib/auth';

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Soft auth gate: in dev we accept anonymous users so the dashboard renders.
  // Production should redirect to /sign-in if user is null.
  const user = await getSessionUser().catch(() => null);

  return (
    <div className="flex min-h-dvh">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AppTopbar user={user ?? { email: 'guest@routerforge.example', name: 'Guest' }} />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
