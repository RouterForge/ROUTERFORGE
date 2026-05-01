import { NextResponse } from 'next/server';
import { z } from 'zod';
import { routeFor } from '@/lib/providers';

export const runtime = 'nodejs';

const schema = z.object({
  modelId: z.string(),
  system: z.string().default(''),
  user: z.string().min(1),
  temperature: z.number().min(0).max(2).default(0.7),
  topP: z.number().min(0).max(1).default(1),
  maxTokens: z.number().int().min(1).max(32_000).default(1024),
  stream: z.boolean().default(true),
});

export async function POST(req: Request) {
  let payload: z.infer<typeof schema>;
  try {
    payload = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const provider = routeFor(payload.modelId);
  const messages = [
    ...(payload.system ? [{ role: 'system' as const, content: payload.system }] : []),
    { role: 'user' as const, content: payload.user },
  ];

  if (!payload.stream) {
    const result = await provider.chat({
      modelId: payload.modelId,
      messages,
      temperature: payload.temperature,
      topP: payload.topP,
      maxTokens: payload.maxTokens,
    });
    return NextResponse.json({
      text: result.choices[0]?.message?.content ?? '',
      usage: result.usage,
      latencyMs: result.latencyMs,
      model: result.model,
    });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of provider.chatStream({
          modelId: payload.modelId,
          messages,
          temperature: payload.temperature,
          topP: payload.topP,
          maxTokens: payload.maxTokens,
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
