import { setRequestLocale } from 'next-intl/server';
import { AppTopbar } from '@/components/app/app-topbar';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { getSessionUser } from '@/lib/auth';

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // In production, redirect to /sign-in if user isn't ADMIN/SUPER_ADMIN.
  const user = await getSessionUser().catch(() => null);

  return (
    <div className="flex min-h-dvh dark">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 text-zinc-100">
        <AppTopbar
          user={user ?? { email: 'admin@routerforge.example', name: 'Admin (preview)' }}
          title="Admin Console"
        />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
