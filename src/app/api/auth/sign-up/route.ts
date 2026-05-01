import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSession, hashPassword } from '@/lib/auth';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(120),
});

export async function POST(req: Request) {
  let payload;
  try {
    payload = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    const existing = await db.user.findUnique({ where: { email: payload.email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }
    const user = await db.user.create({
      data: {
        email: payload.email,
        name: payload.name,
        hashedPassword: await hashPassword(payload.password),
      },
    });
    await createSession(user.id);
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
  } catch {
    return NextResponse.json(
      { error: 'Database not initialized. Run `pnpm db:push` to enable real signup.' },
      { status: 503 },
    );
  }
}
