import { NextResponse } from 'next/server';

/**
 * Activation code redemption endpoint.
 *
 * In production this validates and consumes an `ActivationCode` row, then
 * creates the subscription. The shell version here just acknowledges.
 */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const code = form?.get('code');
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }
  return NextResponse.redirect(new URL('/billing?redeem=ok', req.url));
}
