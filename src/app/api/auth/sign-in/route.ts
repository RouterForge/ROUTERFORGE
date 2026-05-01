import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSession, verifyPassword } from '@/lib/auth';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  let payload;
  try {
    payload = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  // The DB may not be set up yet in dev; fail soft and accept any login as a guest.
  try {
    const user = await db.user.findUnique({ where: { email: payload.email } });
    if (!user || !user.hashedPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const ok = await verifyPassword(payload.password, user.hashedPassword);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    await createSession(user.id);
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
  } catch {
    return NextResponse.json(
      { error: 'Database not initialized. Run `pnpm db:push` to enable real auth.' },
      { status: 503 },
    );
  }
}
