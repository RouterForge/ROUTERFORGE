/**
 * CLIProxyAPI Plus adapter.
 *
 * CLIProxyAPI Plus is treated as the central router/proxy for upstream models
 * (OpenAI, Anthropic, Google, OSS). It exposes an OpenAI-compatible REST API.
 *
 * In dev / when not configured, the adapter returns deterministic mock data so
 * the rest of the platform remains testable without a backend.
 */
import type {
  ChatRequest,
  ChatResponse,
  ProviderAdapter,
  StreamChunk,
} from './types';
import { ProviderError } from './types';

const BASE_URL = process.env.CLIPROXY_BASE_URL ?? '';
const ADMIN_TOKEN = process.env.CLIPROXY_ADMIN_TOKEN ?? '';
const TIMEOUT = Number(process.env.CLIPROXY_DEFAULT_TIMEOUT_MS ?? 60000);

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('TIMEOUT')), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

class CliProxyAdapter implements ProviderAdapter {
  readonly id = 'cliproxy';
  readonly name = 'CLIProxyAPI Plus';

  private get configured() {
    return Boolean(BASE_URL);
  }

  async isHealthy(): Promise<boolean> {
    if (!this.configured) return true; // mock mode
    try {
      const res = await withTimeout(
        fetch(`${BASE_URL}/health`, {
          headers: ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {},
        }),
        5000,
      );
      return res.ok;
    } catch {
      return false;
    }
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const start = Date.now();
    if (!this.configured) {
      return this.mockChat(req, start);
    }
    try {
      const res = await withTimeout(
        fetch(`${BASE_URL}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...(ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {}),
          },
          body: JSON.stringify({
            model: req.modelId,
            messages: req.messages,
            temperature: req.temperature,
            top_p: req.topP,
            max_tokens: req.maxTokens,
            stream: false,
            user: req.user,
          }),
        }),
        TIMEOUT,
      );
      if (!res.ok) {
        const text = await res.text();
        throw new ProviderError('cliproxy', 'upstream_error', text, res.status);
      }
      const json = (await res.json()) as any;
      return {
        id: json.id,
        model: json.model,
        choices: json.choices?.map((c: any, i: number) => ({
          index: i,
          message: c.message,
          finishReason: c.finish_reason ?? null,
        })) ?? [],
        usage: {
          promptTokens: json.usage?.prompt_tokens ?? 0,
          completionTokens: json.usage?.completion_tokens ?? 0,
          totalTokens: json.usage?.total_tokens ?? 0,
        },
        latencyMs: Date.now() - start,
      };
    } catch (e) {
      if (e instanceof ProviderError) throw e;
      throw new ProviderError('cliproxy', 'network', (e as Error).message, 502);
    }
  }

  async *chatStream(req: ChatRequest): AsyncGenerator<StreamChunk> {
    if (!this.configured) {
      yield* this.mockStream(req);
      return;
    }
    const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream',
        ...(ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {}),
      },
      body: JSON.stringify({ ...req, model: req.modelId, stream: true }),
    });
    if (!res.ok || !res.body) {
      throw new ProviderError('cliproxy', 'upstream_error', await res.text().catch(() => ''), res.status);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const raw of lines) {
        const line = raw.trim();
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') {
          yield { delta: '', finished: true };
          return;
        }
        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content ?? '';
          if (delta) yield { delta, finished: false };
        } catch {
          // ignore malformed chunks
        }
      }
    }
    yield { delta: '', finished: true };
  }

  /** Deterministic fake response so playground/chat work without a backend. */
  private mockChat(req: ChatRequest, start: number): ChatResponse {
    const last = req.messages[req.messages.length - 1]?.content ?? '';
    const echo = `(${req.modelId} mock) I received: "${last.slice(0, 200)}". Configure CLIPROXY_BASE_URL to use the real router.`;
    const promptTokens = req.messages.reduce((acc, m) => acc + Math.ceil(m.content.length / 4), 0);
    const completionTokens = Math.ceil(echo.length / 4);
    return {
      id: `rf_mock_${Date.now()}`,
      model: req.modelId,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: echo },
          finishReason: 'stop',
        },
      ],
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      latencyMs: Date.now() - start,
    };
  }

  private async *mockStream(req: ChatRequest): AsyncGenerator<StreamChunk> {
    const full = this.mockChat(req, Date.now()).choices[0].message.content;
    const words = full.split(/(\s+)/);
    for (const w of words) {
      await new Promise((r) => setTimeout(r, 18));
      yield { delta: w, finished: false };
    }
    yield { delta: '', finished: true };
  }
}

export const cliproxy = new CliProxyAdapter();
