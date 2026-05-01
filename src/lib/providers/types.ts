/**
 * Provider adapter interfaces.
 *
 * The platform talks to providers exclusively through these adapters.
 * Concrete adapters (cliproxy, openai, anthropic, google, etc.) implement
 * the same interface so the rest of the app stays provider-agnostic.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}

export interface ChatRequest {
  modelId: string;
  messages: ChatMessage[];
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stream?: boolean;
  user?: string;
}

export interface ChatChoice {
  index: number;
  message: ChatMessage;
  finishReason?: 'stop' | 'length' | 'content_filter' | 'tool_calls' | null;
}

export interface ChatUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatResponse {
  id: string;
  model: string;
  choices: ChatChoice[];
  usage: ChatUsage;
  latencyMs: number;
}

export interface StreamChunk {
  delta: string;
  finished: boolean;
  usage?: ChatUsage;
}

export interface ProviderAdapter {
  /** Stable identifier for routing. */
  readonly id: string;
  /** Pretty name for UI / logs. */
  readonly name: string;
  /** Returns true if the provider currently believes it can serve the request. */
  isHealthy(): Promise<boolean>;
  /** Non-streaming chat completion. */
  chat(req: ChatRequest): Promise<ChatResponse>;
  /** Streaming chat completion. */
  chatStream(req: ChatRequest): AsyncGenerator<StreamChunk>;
}

export class ProviderError extends Error {
  constructor(
    public provider: string,
    public code: string,
    message: string,
    public status: number = 500,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}
