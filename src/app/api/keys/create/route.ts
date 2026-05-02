import { NextResponse } from 'next/server';
import { createApiKey } from '@/services/api-keys';

export async function POST(req: Request) {
  const form = await req.formData();
  const result = await createApiKey(form);
  if (!result) {
    return NextResponse.json(
      { error: 'Not signed in, or database not initialized.' },
      { status: 401 },
    );
  }
  return NextResponse.json(result);
}
