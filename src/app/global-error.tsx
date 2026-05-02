'use client';

import { defaultLocale } from '@/i18n/config';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang={defaultLocale}>
      <body className="bg-background text-foreground">
        <main className="min-h-dvh flex flex-col items-center justify-center gap-4 text-center px-4">
          <div className="text-7xl font-bold">500</div>
          <p className="text-muted-foreground max-w-md">
            {error?.message || 'Something went wrong on our side.'}
          </p>
          <button
            onClick={reset}
            className="rounded-lg bg-primary text-primary-foreground px-5 py-2 text-sm font-medium"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
