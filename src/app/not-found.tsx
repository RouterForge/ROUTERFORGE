import Link from 'next/link';
import { defaultLocale } from '@/i18n/config';

export default function RootNotFound() {
  return (
    <html lang={defaultLocale}>
      <body className="bg-background text-foreground">
        <main className="min-h-dvh flex flex-col items-center justify-center gap-4 text-center px-4">
          <div className="text-7xl font-bold">404</div>
          <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
          <Link
            href={`/${defaultLocale}`}
            className="rounded-lg bg-primary text-primary-foreground px-5 py-2 text-sm font-medium"
          >
            Back to home
          </Link>
        </main>
      </body>
    </html>
  );
}
