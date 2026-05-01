/**
 * Provider router.
 *
 * Today we route everything through CLIProxyAPI Plus. As we add more direct
 * adapters (e.g. for testing or fallback), register them here and update
 * `routeFor()` so the rest of the app keeps a stable interface.
 */
import { cliproxy } from './cliproxy';
import type { ProviderAdapter } from './types';

export const providers: Record<string, ProviderAdapter> = {
  cliproxy,
};

export function routeFor(_modelId: string): ProviderAdapter {
  // Today everything routes through CLIProxyAPI Plus.
  return cliproxy;
}

export type { ChatMessage, ChatRequest, ChatResponse, StreamChunk } from './types';
export { ProviderError } from './types';
