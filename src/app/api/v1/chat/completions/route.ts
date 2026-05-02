import { NextResponse } from 'next/server';
import { z } from 'zod';
import { routeFor } from '@/lib/providers';
import { authenticateApiKey } from '@/services/api-keys';
import { getActiveSubscriptionId, recordUsage } from '@/services/usage';

export const runtime = 'nodejs';

/**
 * OpenAI-compatible chat completions endpoint.
 *
 * Authenticates via the `Authorization: Bearer rf_live_…` header, routes through
 * the CLIProxyAPI Plus adapter, and records a UsageEvent row for analytics.
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

function approxTokenCount(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  const identity = await authenticateApiKey(auth);
  if (!identity) {
    return NextResponse.json(
      {
        error: {
          type: 'invalid_request_error',
          message: 'Missing or invalid API key. Expected "Authorization: Bearer rf_live_…".',
        },
      },
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

  const subscriptionId = await getActiveSubscriptionId(identity.userId);

  const provider = routeFor(payload.model);
  const chatReq = {
    modelId: payload.model,
    messages: payload.messages,
    temperature: payload.temperature,
    topP: payload.top_p,
    maxTokens: payload.max_tokens,
    user: payload.user,
    stream: payload.stream ?? false,
  };
  const start = Date.now();

  if (!payload.stream) {
    try {
      const res = await provider.chat(chatReq);
      await recordUsage({
        userId: identity.userId,
        apiKeyId: identity.apiKeyId,
        subscriptionId,
        modelId: res.model,
        endpoint: '/v1/chat/completions',
        latencyMs: res.latencyMs,
        inputTokens: res.usage.promptTokens,
        outputTokens: res.usage.completionTokens,
        success: true,
      });
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
    } catch (err: any) {
      await recordUsage({
        userId: identity.userId,
        apiKeyId: identity.apiKeyId,
        subscriptionId,
        modelId: payload.model,
        endpoint: '/v1/chat/completions',
        latencyMs: Date.now() - start,
        inputTokens: payload.messages.reduce((a, m) => a + approxTokenCount(m.content), 0),
        outputTokens: 0,
        success: false,
        errorCode: err?.code ?? 'upstream_error',
      });
      return NextResponse.json(
        { error: { type: 'upstream_error', message: err?.message ?? 'Provider error' } },
        { status: err?.status ?? 502 },
      );
    }
  }

  const promptTokens = payload.messages.reduce((a, m) => a + approxTokenCount(m.content), 0);
  let completionText = '';
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const id = `chatcmpl_${Date.now()}`;
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      let success = true;
      try {
        for await (const chunk of provider.chatStream(chatReq)) {
          if (chunk.delta) {
            completionText += chunk.delta;
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
      } catch (err: any) {
        success = false;
        controller.error(err);
      } finally {
        await recordUsage({
          userId: identity.userId,
          apiKeyId: identity.apiKeyId,
          subscriptionId,
          modelId: payload.model,
          endpoint: '/v1/chat/completions',
          latencyMs: Date.now() - start,
          inputTokens: promptTokens,
          outputTokens: approxTokenCount(completionText),
          success,
        });
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
