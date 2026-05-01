import { NextResponse } from 'next/server';
import { MODELS } from '@/lib/models';

export async function GET() {
  return NextResponse.json({
    object: 'list',
    data: MODELS.map((m) => ({
      id: m.id,
      object: 'model',
      owned_by: m.provider,
      family: m.family,
      capabilities: m.capabilities,
      context_window: m.contextWindow,
      max_output: m.maxOutput,
    })),
  });
}
