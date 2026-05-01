import { NextResponse } from 'next/server';

/**
 * Polar.sh webhook handler shell.
 *
 * In production:
 * 1. Verify `polar-signature` header against POLAR_WEBHOOK_SECRET.
 * 2. Switch on event.type and update Payment / Subscription rows.
 */
export async function POST(req: Request) {
  const _body = await req.text();
  return NextResponse.json({ received: true });
}
