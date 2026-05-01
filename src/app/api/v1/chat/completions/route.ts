import { NextResponse } from 'next/server';
import { z } from 'zod';
import { routeFor } from '@/lib/providers';

export const runtime = 'nodejs';

/**
 * OpenAI-compatible chat completions endpoint.
 *
 * In production:
 *   - Authenticate using the `Authorization: Bearer rf_...` header against ApiKey.
 *   - Enforce per-key/plan rate limits.
 *   - Persist a UsageEvent row.
 */
const schema = z.object({
  model: z.string(),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system', 'tool']),
        content: z.string(),
        name: z.string().optional(),
      }),
    )
    .min(1),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  max_tokens: z.number().int().positive().optional(),
  stream: z.boolean().optional(),
  user: z.string().optional(),
});

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.toLowerCase().startsWith('bearer ')) {
    return NextResponse.json(
      { error: { type: 'invalid_request_error', message: 'Missing API key' } },
      { status: 401 },
    );
  }

  let payload: z.infer<typeof schema>;
  try {
    payload = schema.parse(await req.json());
  } catch (e: any) {
    return NextResponse.json(
      { error: { type: 'invalid_request_error', message: e?.message ?? 'Invalid body' } },
      { status: 400 },
    );
  }

  const provider = routeFor(payload.model);
  const req_ = {
    modelId: payload.model,
    messages: payload.messages,
    temperature: payload.temperature,
    topP: payload.top_p,
    maxTokens: payload.max_tokens,
    user: payload.user,
    stream: payload.stream ?? false,
  };

  if (!payload.stream) {
    const res = await provider.chat(req_);
    return NextResponse.json({
      id: res.id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: res.model,
      choices: res.choices.map((c) => ({
        index: c.index,
        message: c.message,
        finish_reason: c.finishReason ?? 'stop',
      })),
      usage: {
        prompt_tokens: res.usage.promptTokens,
        completion_tokens: res.usage.completionTokens,
        total_tokens: res.usage.totalTokens,
      },
    });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const id = `chatcmpl_${Date.now()}`;
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      try {
        for await (const chunk of provider.chatStream(req_)) {
          if (chunk.delta) {
            send({
              id,
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000),
              model: payload.model,
              choices: [
                {
                  index: 0,
                  delta: { content: chunk.delta, role: 'assistant' },
                  finish_reason: null,
                },
              ],
            });
          }
          if (chunk.finished) {
            send({
              id,
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000),
              model: payload.model,
              choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
            });
            break;
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    },
  });
}
