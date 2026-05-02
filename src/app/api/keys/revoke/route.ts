import { NextResponse } from 'next/server';
import { revokeApiKey } from '@/services/api-keys';

export async function POST(req: Request) {
  const form = await req.formData();
  await revokeApiKey(form);
  return NextResponse.json({ ok: true });
}
