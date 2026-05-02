import type { ModelFamilyId } from './models';

/**
 * Billing periods, adapted from the RouterLab pricing reference.
 *
 * Every period is priced dynamically from the plan's `baseMonth` value using:
 *   price = (baseMonth / 30) * days * (1 - discount)
 *
 * Monthly is the baseline (0% discount). Multi-day and multi-month commitments
 * get increasing savings. The ids are short for URLs / DB rows.
 */
export const PERIODS = [
  { id: '1d', label: '1 Day', days: 1, discount: 0, unit: 'day' },
  { id: '3d', label: '3 Days', days: 3, discount: 0.05, unit: '3 days' },
  { id: '1w', label: '1 Week', days: 7, discount: 0.1, unit: 'week' },
  { id: '2w', label: '2 Weeks', days: 14, discount: 0.13, unit: '2 weeks' },
  { id: '1m', label: '1 Month', days: 30, discount: 0, unit: 'month' },
  { id: '3m', label: '3 Months', days: 90, discount: 0.15, unit: '3 months' },
  { id: '6m', label: '6 Months', days: 180, discount: 0.22, unit: '6 months' },
  { id: '1y', label: '1 Year', days: 365, discount: 0.35, unit: 'year' },
] as const;

export type PeriodId = (typeof PERIODS)[number]['id'];
export type Period = (typeof PERIODS)[number];

export const DEFAULT_PERIOD_ID: PeriodId = '1m';

export function getPeriod(id: string): Period {
  return PERIODS.find((p) => p.id === id) ?? PERIODS[4]; // default to 1 Month
}

/**
 * Legacy cycle type kept for compatibility with the Prisma schema's 4 explicit
 * price columns. Maps to the canonical period ids.
 */
export type BillingCycle = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const BILLING_CYCLES: BillingCycle[] = ['daily', 'weekly', 'monthly', 'yearly'];

export function cycleToPeriodId(c: BillingCycle): PeriodId {
  return c === 'daily' ? '1d' : c === 'weekly' ? '1w' : c === 'yearly' ? '1y' : '1m';
}

export function periodIdToCycle(id: string): BillingCycle {
  switch (id) {
    case '1d':
    case '3d':
      return 'daily';
    case '1w':
    case '2w':
      return 'weekly';
    case '3m':
    case '6m':
      return 'monthly';
    case '1y':
      return 'yearly';
    default:
      return 'monthly';
  }
}

/* -------------------------------------------------------------------------
 * Plans
 * ----------------------------------------------------------------------- */

export interface PlanTier {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  /** Hex accent color used on the pricing page. */
  color: string;
  /** Tailwind gradient for the card border / glow. */
  accent: string;
  /** Canonical monthly price in USD. All periods are derived from this. */
  baseMonth: number;
  /** Model families included in the plan. Every plan implicitly bundles OSS. */
  families: ModelFamilyId[];
  /** Marketing model list rendered on the pricing card. */
  models: string[];
  /** Card badge. */
  badge?: 'Popular' | 'New' | 'Best Value';
}

export const PLANS: PlanTier[] = [
  {
    id: 'opensource',
    name: 'Open Source',
    subtitle: 'Llama · Mistral · DeepSeek · Qwen',
    description: 'Best open-source models, unlimited creativity.',
    color: '#6366f1',
    accent: 'from-indigo-500 to-violet-500',
    baseMonth: 4.99,
    families: ['oss'],
    models: ['Llama 3.3', 'Mistral Large', 'DeepSeek R1', 'Qwen 2.5', '+ more'],
  },
  {
    id: 'gemini',
    name: 'Gemini',
    subtitle: 'Gemini + Open Source Models',
    description: "Google's Gemini family plus every open-source model.",
    color: '#0ea5e9',
    accent: 'from-sky-500 to-cyan-500',
    baseMonth: 8.99,
    families: ['gemini', 'oss'],
    models: ['Gemini 2.0 Flash', 'Gemini 1.5 Pro', 'Gemini Ultra', '+ Open Source'],
  },
  {
    id: 'gpt',
    name: 'GPT · Codex',
    subtitle: 'OpenAI + Open Source Models',
    description: "OpenAI's full lineup and open-source power.",
    color: '#10b981',
    accent: 'from-emerald-500 to-teal-500',
    baseMonth: 14.99,
    badge: 'Popular',
    families: ['openai', 'oss'],
    models: ['GPT-4o', 'o3-mini', 'Codex', 'GPT-4.1', '+ Open Source'],
  },
  {
    id: 'claude',
    name: 'Claude',
    subtitle: 'Anthropic Claude + Open Source Models',
    description: "Anthropic's Claude family and every open-source model.",
    color: '#d97706',
    accent: 'from-amber-600 to-orange-500',
    baseMonth: 18.99,
    badge: 'New',
    families: ['claude', 'oss'],
    models: ['Claude Opus 4.6', 'Claude Sonnet 4.6', 'Claude Haiku 4.5', '+ Open Source'],
  },
  {
    id: 'bundle',
    name: 'Bundle',
    subtitle: 'GPT · Gemini · Claude · Open Source',
    description: 'Every model. One subscription.',
    color: '#f59e0b',
    accent: 'from-orange-500 via-rose-500 to-fuchsia-500',
    baseMonth: 32.99,
    badge: 'Best Value',
    families: ['openai', 'claude', 'gemini', 'oss'],
    models: [
      'All GPT · Codex models',
      'All Gemini models',
      'All Claude models',
      'All Open Source models',
    ],
  },
];

export function getPlan(id: string): PlanTier | undefined {
  return PLANS.find((p) => p.id === id);
}

/* -------------------------------------------------------------------------
 * Price math
 * ----------------------------------------------------------------------- */

export function calcPrice(baseMonth: number, days: number, discount: number): number {
  const daily = baseMonth / 30;
  const raw = daily * days;
  return Math.max(0, Number((raw * (1 - discount)).toFixed(2)));
}

export function priceFor(plan: PlanTier, period: Period | PeriodId): number {
  const p = typeof period === 'string' ? getPeriod(period) : period;
  return calcPrice(plan.baseMonth, p.days, p.discount);
}

/** Percentage saved vs. paying the `1m` rate pro-rated over the same days. */
export function savingsVs1m(plan: PlanTier, period: Period | PeriodId): number {
  const p = typeof period === 'string' ? getPeriod(period) : period;
  const baseline = (plan.baseMonth / 30) * p.days;
  const actual = priceFor(plan, p);
  if (baseline <= 0) return 0;
  return Math.max(0, Math.round(((baseline - actual) / baseline) * 100));
}

export function planDurationMs(period: BillingCycle | PeriodId): number {
  const DAY = 86_400_000;
  if (period === 'daily') return DAY;
  if (period === 'weekly') return 7 * DAY;
  if (period === 'monthly') return 30 * DAY;
  if (period === 'yearly') return 365 * DAY;
  const p = getPeriod(period);
  return p.days * DAY;
}

/* -------------------------------------------------------------------------
 * Payment methods (unchanged)
 * ----------------------------------------------------------------------- */

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
