export type ModelFamilyId = 'openai' | 'claude' | 'gemini' | 'oss';

export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'meta' | 'mistral' | 'qwen' | 'deepseek' | 'other';

export interface ModelSpec {
  id: string;
  label: string;
  family: ModelFamilyId;
  provider: ModelProvider;
  /** Display tagline shown in the UI */
  tagline: string;
  /** Typical input context window in tokens */
  contextWindow: number;
  /** Max tokens the model can output */
  maxOutput: number;
  /** Price per 1M input tokens if used directly with provider */
  inputPricePerMTokens: number;
  /** Price per 1M output tokens if used directly with provider */
  outputPricePerMTokens: number;
  /** Marketing capabilities */
  capabilities: Array<'chat' | 'vision' | 'code' | 'reasoning' | 'long-context' | 'tools'>;
  /** Whether this model supports streaming */
  streaming: boolean;
  /** Relative "speed" score used by routing presets */
  speed: number;
  /** Relative "reasoning" score used by routing presets */
  reasoning: number;
  /** Relative "value" score used by routing presets */
  value: number;
}

export const MODEL_FAMILIES: Record<ModelFamilyId, { label: string; accent: string; blurb: string }> = {
  openai: {
    label: 'OpenAI / GPT / Codex',
    accent: 'from-emerald-500 to-teal-500',
    blurb: "OpenAI's GPT and Codex families for general-purpose reasoning, code, and agents.",
  },
  claude: {
    label: 'Anthropic Claude',
    accent: 'from-orange-500 to-rose-500',
    blurb: 'Claude models for long-context reasoning, safety-aware generation, and coding.',
  },
  gemini: {
    label: 'Google Gemini',
    accent: 'from-indigo-500 to-sky-500',
    blurb: "Google's Gemini family with strong multimodal, tool-use, and long-context ability.",
  },
  oss: {
    label: 'Open Source',
    accent: 'from-fuchsia-500 to-violet-500',
    blurb: 'Curated open-weight models — Llama, Qwen, Mistral, DeepSeek — for cost and control.',
  },
};

export const MODELS: ModelSpec[] = [
  // OpenAI
  {
    id: 'gpt-4o',
    label: 'GPT-4o',
    family: 'openai',
    provider: 'openai',
    tagline: 'Flagship general-purpose model for chat, vision, and tools.',
    contextWindow: 128_000,
    maxOutput: 16_000,
    inputPricePerMTokens: 2.5,
    outputPricePerMTokens: 10,
    capabilities: ['chat', 'vision', 'tools', 'code'],
    streaming: true,
    speed: 8,
    reasoning: 8,
    value: 7,
  },
  {
    id: 'gpt-4o-mini',
    label: 'GPT-4o mini',
    family: 'openai',
    provider: 'openai',
    tagline: 'Fast, affordable general-purpose model.',
    contextWindow: 128_000,
    maxOutput: 16_000,
    inputPricePerMTokens: 0.15,
    outputPricePerMTokens: 0.6,
    capabilities: ['chat', 'vision', 'tools'],
    streaming: true,
    speed: 9,
    reasoning: 6,
    value: 10,
  },
  {
    id: 'o1',
    label: 'o1',
    family: 'openai',
    provider: 'openai',
    tagline: 'Deep reasoning model for hard problems.',
    contextWindow: 200_000,
    maxOutput: 100_000,
    inputPricePerMTokens: 15,
    outputPricePerMTokens: 60,
    capabilities: ['reasoning', 'code', 'chat'],
    streaming: false,
    speed: 3,
    reasoning: 10,
    value: 5,
  },
  {
    id: 'codex-latest',
    label: 'Codex',
    family: 'openai',
    provider: 'openai',
    tagline: 'Coding-focused model with agent-style tool use.',
    contextWindow: 128_000,
    maxOutput: 16_000,
    inputPricePerMTokens: 3,
    outputPricePerMTokens: 12,
    capabilities: ['code', 'tools', 'reasoning'],
    streaming: true,
    speed: 7,
    reasoning: 9,
    value: 7,
  },
  // Anthropic
  {
    id: 'claude-3-5-sonnet',
    label: 'Claude 3.5 Sonnet',
    family: 'claude',
    provider: 'anthropic',
    tagline: 'Balanced frontier model with strong coding and reasoning.',
    contextWindow: 200_000,
    maxOutput: 8_192,
    inputPricePerMTokens: 3,
    outputPricePerMTokens: 15,
    capabilities: ['chat', 'vision', 'code', 'reasoning', 'long-context'],
    streaming: true,
    speed: 8,
    reasoning: 9,
    value: 8,
  },
  {
    id: 'claude-3-5-haiku',
    label: 'Claude 3.5 Haiku',
    family: 'claude',
    provider: 'anthropic',
    tagline: 'Fast Claude for high-volume tasks.',
    contextWindow: 200_000,
    maxOutput: 8_192,
    inputPricePerMTokens: 0.8,
    outputPricePerMTokens: 4,
    capabilities: ['chat', 'code', 'tools'],
    streaming: true,
    speed: 9,
    reasoning: 7,
    value: 9,
  },
  {
    id: 'claude-3-opus',
    label: 'Claude 3 Opus',
    family: 'claude',
    provider: 'anthropic',
    tagline: 'Large Claude with deep reasoning.',
    contextWindow: 200_000,
    maxOutput: 4_096,
    inputPricePerMTokens: 15,
    outputPricePerMTokens: 75,
    capabilities: ['reasoning', 'code', 'long-context'],
    streaming: true,
    speed: 5,
    reasoning: 10,
    value: 4,
  },
  // Gemini
  {
    id: 'gemini-2-0-pro',
    label: 'Gemini 2.0 Pro',
    family: 'gemini',
    provider: 'google',
    tagline: 'Google flagship with long-context and multimodal.',
    contextWindow: 1_000_000,
    maxOutput: 8_192,
    inputPricePerMTokens: 1.25,
    outputPricePerMTokens: 5,
    capabilities: ['chat', 'vision', 'tools', 'long-context'],
    streaming: true,
    speed: 8,
    reasoning: 9,
    value: 9,
  },
  {
    id: 'gemini-2-0-flash',
    label: 'Gemini 2.0 Flash',
    family: 'gemini',
    provider: 'google',
    tagline: 'Fast, multimodal workhorse.',
    contextWindow: 1_000_000,
    maxOutput: 8_192,
    inputPricePerMTokens: 0.1,
    outputPricePerMTokens: 0.4,
    capabilities: ['chat', 'vision', 'tools'],
    streaming: true,
    speed: 10,
    reasoning: 7,
    value: 10,
  },
  // Open source
  {
    id: 'llama-3-1-70b',
    label: 'Llama 3.1 70B',
    family: 'oss',
    provider: 'meta',
    tagline: 'Open-weight workhorse for chat and code.',
    contextWindow: 128_000,
    maxOutput: 4_096,
    inputPricePerMTokens: 0.6,
    outputPricePerMTokens: 0.9,
    capabilities: ['chat', 'code'],
    streaming: true,
    speed: 8,
    reasoning: 7,
    value: 9,
  },
  {
    id: 'qwen-2-5-72b',
    label: 'Qwen 2.5 72B',
    family: 'oss',
    provider: 'qwen',
    tagline: 'Strong multilingual open model.',
    contextWindow: 131_072,
    maxOutput: 4_096,
    inputPricePerMTokens: 0.5,
    outputPricePerMTokens: 0.8,
    capabilities: ['chat', 'code', 'long-context'],
    streaming: true,
    speed: 7,
    reasoning: 8,
    value: 9,
  },
  {
    id: 'deepseek-v3',
    label: 'DeepSeek V3',
    family: 'oss',
    provider: 'deepseek',
    tagline: 'Efficient reasoning at open prices.',
    contextWindow: 128_000,
    maxOutput: 8_192,
    inputPricePerMTokens: 0.27,
    outputPricePerMTokens: 1.1,
    capabilities: ['reasoning', 'code'],
    streaming: true,
    speed: 7,
    reasoning: 9,
    value: 10,
  },
];

export function getModel(id: string): ModelSpec | undefined {
  return MODELS.find((m) => m.id === id);
}

export function modelsByFamily(family: ModelFamilyId): ModelSpec[] {
  return MODELS.filter((m) => m.family === family);
}

export type RoutingPreset = 'fastest' | 'best-reasoning' | 'best-value';

export function pickByPreset(preset: RoutingPreset, models = MODELS): ModelSpec {
  const scorer: Record<RoutingPreset, (m: ModelSpec) => number> = {
    fastest: (m) => m.speed,
    'best-reasoning': (m) => m.reasoning,
    'best-value': (m) => m.value,
  };
  return [...models].sort((a, b) => scorer[preset](b) - scorer[preset](a))[0];
}
