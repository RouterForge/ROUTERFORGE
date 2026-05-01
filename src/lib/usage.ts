/**
 * Usage analytics helpers.
 *
 * Generates illustrative time-series and aggregate data so the dashboard and
 * admin pages render meaningfully even before a usage event is recorded.
 * In production these helpers should pull from the UsageEvent table.
 */
import { MODELS } from './models';

export interface SeriesPoint {
  t: string; // ISO date or hour label
  requests: number;
  inputTokens: number;
  outputTokens: number;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function generateUsageSeries(days = 30, seed = 7): SeriesPoint[] {
  const r = rng(seed);
  const out: SeriesPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const base = 350 + Math.floor(r() * 600);
    const trend = Math.sin(i / 5) * 80;
    const reqs = Math.max(40, Math.floor(base + trend));
    const inT = reqs * (180 + Math.floor(r() * 60));
    const outT = reqs * (220 + Math.floor(r() * 80));
    out.push({
      t: date.toISOString().slice(0, 10),
      requests: reqs,
      inputTokens: inT,
      outputTokens: outT,
    });
  }
  return out;
}

export function modelDistribution(seed = 11): Array<{ model: string; share: number; family: string }> {
  const r = rng(seed);
  const top = MODELS.slice(0, 6);
  const raw = top.map((m) => ({ model: m.label, family: m.family, share: 0.3 + r() }));
  const sum = raw.reduce((a, x) => a + x.share, 0);
  return raw.map((x) => ({ ...x, share: Math.round((x.share / sum) * 100) }));
}

export function aggregateUsage(series: SeriesPoint[]) {
  const totals = series.reduce(
    (acc, p) => ({
      requests: acc.requests + p.requests,
      inputTokens: acc.inputTokens + p.inputTokens,
      outputTokens: acc.outputTokens + p.outputTokens,
    }),
    { requests: 0, inputTokens: 0, outputTokens: 0 },
  );
  const days = series.length || 1;
  const avgRPD = Math.round(totals.requests / days);
  const avgRPM = Math.round(avgRPD / (24 * 60));
  const avgRPT = totals.requests > 0 ? Math.round((totals.inputTokens + totals.outputTokens) / totals.requests) : 0;
  return { ...totals, avgRPD, avgRPM, avgRPT };
}

/** Estimate provider-direct cost for the dashboard "savings" widget. */
export function estimateDirectCost(series: SeriesPoint[]): number {
  const blendedInput = 1.5; // $/M tokens
  const blendedOutput = 5; // $/M tokens
  const inT = series.reduce((a, p) => a + p.inputTokens, 0);
  const outT = series.reduce((a, p) => a + p.outputTokens, 0);
  return Number(((inT / 1e6) * blendedInput + (outT / 1e6) * blendedOutput).toFixed(2));
}

export interface ActivityRow {
  id: string;
  ts: string;
  model: string;
  endpoint: string;
  tokens: number;
  latencyMs: number;
  status: 'ok' | 'fail';
}

export function generateActivity(count = 12, seed = 17): ActivityRow[] {
  const r = rng(seed);
  const out: ActivityRow[] = [];
  for (let i = 0; i < count; i++) {
    const m = MODELS[Math.floor(r() * MODELS.length)];
    out.push({
      id: `evt_${(seed + i).toString(36)}`,
      ts: new Date(Date.now() - i * 60_000 * (1 + r() * 12)).toISOString(),
      model: m.label,
      endpoint: '/v1/chat/completions',
      tokens: 200 + Math.floor(r() * 1800),
      latencyMs: 280 + Math.floor(r() * 1500),
      status: r() > 0.05 ? 'ok' : 'fail',
    });
  }
  return out;
}
