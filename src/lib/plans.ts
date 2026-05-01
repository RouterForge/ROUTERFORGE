import type { ModelFamilyId } from './models';

export type BillingCycle = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface PlanTier {
  id: string;
  name: string;
  families: ModelFamilyId[];
  tagline: string;
  badge?: 'popular' | 'best-value';
  includes: string[];
  /** Indicative request quota per day */
  requestsPerDay: number;
  /** Price in USD for each billing cycle */
  prices: Record<BillingCycle, number>;
}

/**
 * Pricing intentionally uses clear, rounded numbers and rewards longer
 * commitments. Yearly plans give ~2 months free vs monthly.
 */
export const PLANS: PlanTier[] = [
  {
    id: 'oss',
    name: 'Open Source',
    families: ['oss'],
    tagline: 'Open-weight models for high volume and tight budgets.',
    includes: [
      'Llama 3.1, Qwen 2.5, DeepSeek V3',
      'OpenAI-compatible API',
      'Streaming responses',
      'Community support',
    ],
    requestsPerDay: 3_000,
    prices: { daily: 1.5, weekly: 8, monthly: 19, yearly: 190 },
  },
  {
    id: 'gemini',
    name: 'Gemini',
    families: ['gemini'],
    tagline: 'Google Gemini Pro + Flash with massive context.',
    includes: [
      'Gemini 2.0 Pro & Flash',
      'Up to 1M token context',
      'Vision & tools',
      'Standard support',
    ],
    requestsPerDay: 4_000,
    prices: { daily: 2.5, weekly: 14, monthly: 39, yearly: 390 },
  },
  {
    id: 'gpt',
    name: 'GPT / Codex',
    families: ['openai'],
    tagline: 'GPT-4o, o1, and Codex for reasoning & coding agents.',
    badge: 'popular',
    includes: [
      'GPT-4o + GPT-4o mini',
      'o1 deep reasoning',
      'Codex coding model',
      'Priority routing',
    ],
    requestsPerDay: 5_000,
    prices: { daily: 3.5, weekly: 19, monthly: 49, yearly: 490 },
  },
  {
    id: 'claude',
    name: 'Claude',
    families: ['claude'],
    tagline: 'Anthropic Claude family — Sonnet, Haiku, Opus.',
    includes: [
      'Claude 3.5 Sonnet + Haiku',
      'Claude 3 Opus for deep work',
      '200k token context',
      'Priority routing',
    ],
    requestsPerDay: 5_000,
    prices: { daily: 3.5, weekly: 19, monthly: 49, yearly: 490 },
  },
  {
    id: 'bundle',
    name: 'Bundle',
    families: ['openai', 'claude', 'gemini', 'oss'],
    tagline: 'Everything in one plan — all four model families.',
    badge: 'best-value',
    includes: [
      'All models: GPT, Claude, Gemini, OSS',
      'Smart routing presets',
      'Higher rate limits',
      'Priority support',
    ],
    requestsPerDay: 12_000,
    prices: { daily: 8, weekly: 45, monthly: 119, yearly: 1190 },
  },
];

export const BILLING_LABELS: Record<BillingCycle, string> = {
  daily: 'day',
  weekly: 'week',
  monthly: 'month',
  yearly: 'year',
};

export function planDurationMs(cycle: BillingCycle): number {
  const DAY = 86_400_000;
  switch (cycle) {
    case 'daily':
      return DAY;
    case 'weekly':
      return 7 * DAY;
    case 'monthly':
      return 30 * DAY;
    case 'yearly':
      return 365 * DAY;
  }
}

export function getPlan(id: string): PlanTier | undefined {
  return PLANS.find((p) => p.id === id);
}

/** Savings % vs. the monthly price pro-rated */
export function savingsVsMonthly(plan: PlanTier, cycle: BillingCycle): number {
  if (cycle === 'monthly') return 0;
  const monthly = plan.prices.monthly;
  const cyclePrice = plan.prices[cycle];
  const months = planDurationMs(cycle) / planDurationMs('monthly');
  const baseline = monthly * months;
  if (baseline <= 0) return 0;
  return Math.max(0, Math.round(((baseline - cyclePrice) / baseline) * 100));
}

export const PAYMENT_METHODS = [
  {
    id: 'card',
    label: 'Debit / Credit card',
    hint: 'Processed via Polar.sh',
    icon: 'card',
  },
  {
    id: 'binance',
    label: 'Binance Pay',
    hint: 'Instant crypto checkout',
    icon: 'binance',
  },
  {
    id: 'bybit',
    label: 'Bybit Pay',
    hint: 'Pay from your Bybit wallet',
    icon: 'bybit',
  },
  {
    id: 'crypto',
    label: 'Crypto (on-chain)',
    hint: 'USDT, USDC, BTC, ETH',
    icon: 'crypto',
  },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]['id'];
