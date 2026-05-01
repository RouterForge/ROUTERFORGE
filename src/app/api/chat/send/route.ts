import { z } from 'zod';
import { NextResponse } from 'next/server';
import { routeFor } from '@/lib/providers';

export const runtime = 'nodejs';

const schema = z.object({
  modelId: z.string(),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system', 'tool']),
        content: z.string(),
      }),
    )
    .min(1),
});

export async function POST(req: Request) {
  let payload: z.infer<typeof schema>;
  try {
    payload = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const provider = routeFor(payload.modelId);
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of provider.chatStream({
          modelId: payload.modelId,
          messages: payload.messages,
          stream: true,
        })) {
          if (chunk.delta) controller.enqueue(encoder.encode(chunk.delta));
          if (chunk.finished) break;
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
    },
  });
}
