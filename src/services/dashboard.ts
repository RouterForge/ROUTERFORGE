import 'server-only';
import { db } from '@/lib/db';
import {
  aggregateUsage,
  estimateDirectCost,
  type SeriesPoint,
} from '@/lib/usage';
import { MODELS } from '@/lib/models';
import { getActiveSubscription } from './subscriptions';

export interface DashboardData {
  subscription: {
    planName: string;
    cycle: string;
    status: 'ACTIVE' | 'EXPIRED' | 'PAUSED' | 'CANCELLED' | 'NONE';
    endsAt: string | null;
    daysRemaining: number;
    cycleProgressPct: number;
  };
  series: SeriesPoint[];
  topModels: Array<{ model: string; share: number; family?: string }>;
  totals: {
    requests: number;
    inputTokens: number;
    outputTokens: number;
    avgRPD: number;
    avgRPM: number;
    avgRPT: number;
  };
  directCost: number;
  activity: Array<{
    id: string;
    ts: string;
    model: string;
    endpoint: string;
    tokens: number;
    latencyMs: number;
    status: 'ok' | 'fail';
  }>;
  hasRealData: boolean;
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const [events, activity, sub] = await Promise.all([
    safe(
      () =>
        db.usageEvent.findMany({
          where: {
            userId,
            createdAt: { gte: new Date(Date.now() - 30 * 86400_000) },
          },
          select: {
            createdAt: true,
            inputTokens: true,
            outputTokens: true,
            modelId: true,
          },
        }),
      [] as Array<{
        createdAt: Date;
        inputTokens: number;
        outputTokens: number;
        modelId: string;
      }>,
    ),
    safe(
      () =>
        db.usageEvent.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 12,
        }),
      [] as Array<any>,
    ),
    getActiveSubscription(userId),
  ]);

  const hasRealData = events.length > 0;
  // Always read from real data. Empty buckets render an empty chart, which is
  // honest. We no longer synthesize requests just so the chart "looks busy".
  const series = bucketDaily(events);
  const topModels = topModelsFromEvents(events);
  const agg = aggregateUsage(series);
  const directCost = estimateDirectCost(series);

  const activityRows = activity.map((e) => ({
    id: e.id,
    ts: e.createdAt.toISOString(),
    model: MODELS.find((m) => m.id === e.modelId)?.label ?? e.modelId,
    endpoint: e.endpoint,
    tokens: e.inputTokens + e.outputTokens,
    latencyMs: e.latencyMs,
    status: (e.success ? 'ok' : 'fail') as 'ok' | 'fail',
  }));

  const subscription = deriveSubscriptionDisplay(sub);

  return {
    subscription,
    series,
    topModels,
    totals: {
      requests: agg.requests,
      inputTokens: agg.inputTokens,
      outputTokens: agg.outputTokens,
      avgRPD: agg.avgRPD,
      avgRPM: agg.avgRPM,
      avgRPT: agg.avgRPT,
    },
    directCost,
    activity: activityRows,
    hasRealData,
  };
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

function bucketDaily(
  rows: Array<{ createdAt: Date; inputTokens: number; outputTokens: number }>,
): SeriesPoint[] {
  const buckets = new Map<string, SeriesPoint>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { t: key, requests: 0, inputTokens: 0, outputTokens: 0 });
  }
  for (const r of rows) {
    const key = r.createdAt.toISOString().slice(0, 10);
    const b = buckets.get(key);
    if (!b) continue;
    b.requests += 1;
    b.inputTokens += r.inputTokens;
    b.outputTokens += r.outputTokens;
  }
  return Array.from(buckets.values());
}

function topModelsFromEvents(rows: Array<{ modelId: string }>) {
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.modelId, (counts.get(r.modelId) ?? 0) + 1);
  const total = rows.length || 1;
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([modelId, count]) => {
      const meta = MODELS.find((m) => m.id === modelId);
      return {
        model: meta?.label ?? modelId,
        share: Math.round((count / total) * 100),
        family: meta?.family,
      };
    });
}

function deriveSubscriptionDisplay(
  sub: Awaited<ReturnType<typeof getActiveSubscription>>,
): DashboardData['subscription'] {
  if (!sub) {
    return {
      planName: 'No active plan',
      cycle: '—',
      status: 'NONE',
      endsAt: null,
      daysRemaining: 0,
      cycleProgressPct: 0,
    };
  }
  const now = Date.now();
  const total = sub.endsAt.getTime() - sub.startsAt.getTime();
  const used = now - sub.startsAt.getTime();
  const pct = total > 0 ? Math.min(100, Math.max(0, Math.round((used / total) * 100))) : 100;
  const daysRemaining = Math.max(0, Math.ceil((sub.endsAt.getTime() - now) / 86400_000));
  return {
    planName: sub.planName,
    cycle: sub.cycle,
    status: sub.status as DashboardData['subscription']['status'],
    endsAt: sub.endsAt.toISOString(),
    daysRemaining,
    cycleProgressPct: pct,
  };
}
