import { NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    schema.parse(await req.json());
  } catch {
    // We respond OK even on failure to avoid email enumeration.
  }
  // In production, generate a token and email a reset link.
  // For now this endpoint always succeeds.
  return NextResponse.json({ ok: true });
}
