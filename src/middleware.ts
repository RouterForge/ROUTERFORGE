import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/navigation';

export default createMiddleware(routing);

export const config = {
  // Match all routes except Next.js internals, static assets, and API routes.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
