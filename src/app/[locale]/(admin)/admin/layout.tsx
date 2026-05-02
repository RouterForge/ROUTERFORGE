import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
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

  const user = await getSessionUser().catch(() => null);
  if (!user) {
    redirect(`/${locale}/sign-in?next=/admin`);
  }
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="flex min-h-dvh">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AppTopbar user={user} title="Admin Console" />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
