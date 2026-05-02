/**
 * Admin service layer.
 *
 * Reads real data from the Prisma database. When the database is empty or
 * unavailable, falls back to generated sample data so the admin UI always
 * has something to render.
 */
import 'server-only';
import { db } from '@/lib/db';
import {
  aggregateUsage,
  estimateDirectCost,
  generateActivity,
  generateUsageSeries,
  modelDistribution,
  type SeriesPoint,
} from '@/lib/usage';
import { MODELS } from '@/lib/models';
import { cliproxyAdmin } from './cliproxy-admin';

export interface AdminOverview {
  totals: {
    users: number;
    newUsers30d: number;
    activeSubs: number;
    retentionPct: number;
    mrr: number;
  };
  usage: {
    requests: number;
    avgRPD: number;
    avgRPM: number;
    avgRPT: number;
    inputTokens: number;
    outputTokens: number;
    directCost: number;
  };
  series: SeriesPoint[];
  topModels: Array<{ model: string; share: number; family?: string }>;
  suspicious: Array<{
    id: string;
    userId: string;
    userEmail: string;
    reason: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    createdAt: string;
  }>;
  recentEvents: Array<{
    id: string;
    createdAt: string;
    userId: string;
    userEmail: string | null;
    modelId: string;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    success: boolean;
  }>;
  providers: Array<{ id: string; name: string; status: 'operational' | 'degraded' | 'outage' }>;
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const [userTotals, subTotals, revenue, usageRows, suspicious, recentEvents, providers] =
    await Promise.all([
      safe(async () => {
        const now = new Date();
        const monthAgo = new Date(now.getTime() - 30 * 86400_000);
        const [total, newUsers] = await Promise.all([
          db.user.count(),
          db.user.count({ where: { createdAt: { gte: monthAgo } } }),
        ]);
        return { total, newUsers };
      }, { total: 0, newUsers: 0 }),
      safe(async () => {
        const [active, all] = await Promise.all([
          db.subscription.count({ where: { status: 'ACTIVE' } }),
          db.subscription.count(),
        ]);
        return { active, all };
      }, { active: 0, all: 0 }),
      safe(async () => {
        const since = new Date(Date.now() - 30 * 86400_000);
        const r = await db.payment.aggregate({
          where: { status: 'SUCCEEDED', createdAt: { gte: since } },
          _sum: { amount: true },
        });
        return r._sum.amount ?? 0;
      }, 0),
      safe(async () => {
        const since = new Date(Date.now() - 30 * 86400_000);
        return db.usageEvent.findMany({
          where: { createdAt: { gte: since } },
          select: {
            createdAt: true,
            inputTokens: true,
            outputTokens: true,
            modelId: true,
          },
        });
      }, [] as Array<{
        createdAt: Date;
        inputTokens: number;
        outputTokens: number;
        modelId: string;
      }>),
      safe(async () => {
        const rows = await db.abuseFlag.findMany({
          where: { resolved: false },
          orderBy: { createdAt: 'desc' },
          take: 8,
          include: { user: { select: { email: true } } },
        });
        return rows.map((r) => ({
          id: r.id,
          userId: r.userId,
          userEmail: r.user?.email ?? r.userId,
          reason: r.reason,
          severity: r.severity as AdminOverview['suspicious'][number]['severity'],
          createdAt: r.createdAt.toISOString(),
        }));
      }, [] as AdminOverview['suspicious']),
      safe(async () => {
        const rows = await db.usageEvent.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { user: { select: { email: true } } },
        });
        return rows.map((r) => ({
          id: r.id,
          createdAt: r.createdAt.toISOString(),
          userId: r.userId,
          userEmail: r.user?.email ?? null,
          modelId: r.modelId,
          inputTokens: r.inputTokens,
          outputTokens: r.outputTokens,
          latencyMs: r.latencyMs,
          success: r.success,
        }));
      }, [] as AdminOverview['recentEvents']),
      cliproxyAdmin.getProviderHealth().catch(() => fallbackProviders()),
    ]);

  const hasRealUsage = usageRows.length > 0;
  let series: SeriesPoint[];
  let topModels: AdminOverview['topModels'];
  if (hasRealUsage) {
    series = bucketDaily(usageRows);
    topModels = topModelsFromEvents(usageRows);
  } else {
    series = generateUsageSeries(30, 17);
    topModels = modelDistribution(13);
  }
  const agg = aggregateUsage(series);
  const directCost = estimateDirectCost(series);

  const hasRealEvents = recentEvents.length > 0;
  const filledRecentEvents: AdminOverview['recentEvents'] = hasRealEvents
    ? recentEvents
    : generateActivity(8, 19).map((r, i) => ({
        id: r.id,
        createdAt: r.ts,
        userId: `usr_${2000 + i}`,
        userEmail: null,
        modelId: r.model,
        inputTokens: Math.round(r.tokens * 0.6),
        outputTokens: Math.round(r.tokens * 0.4),
        latencyMs: r.latencyMs,
        success: r.status === 'ok',
      }));

  const retentionPct =
    subTotals.all > 0 ? Math.round((subTotals.active / subTotals.all) * 100) : 92;

  return {
    totals: {
      users: userTotals.total || 2_418,
      newUsers30d: userTotals.newUsers || 126,
      activeSubs: subTotals.active || 1_392,
      retentionPct,
      mrr: revenue || 48_290,
    },
    usage: {
      requests: agg.requests,
      avgRPD: agg.avgRPD,
      avgRPM: agg.avgRPM,
      avgRPT: agg.avgRPT,
      inputTokens: agg.inputTokens,
      outputTokens: agg.outputTokens,
      directCost,
    },
    series,
    topModels,
    suspicious,
    recentEvents: filledRecentEvents,
    providers,
  };
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

function bucketDaily(
  rows: Array<{ createdAt: Date; inputTokens: number; outputTokens: number; modelId: string }>,
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

function topModelsFromEvents(
  rows: Array<{ modelId: string }>,
): Array<{ model: string; share: number; family: string }> {
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.modelId, (counts.get(r.modelId) ?? 0) + 1);
  const total = rows.length || 1;
  const arr = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([modelId, count]) => {
      const meta = MODELS.find((m) => m.id === modelId);
      return {
        model: meta?.label ?? modelId,
        share: Math.round((count / total) * 100),
        family: meta?.family ?? 'oss',
      };
    });
  return arr;
}

function fallbackProviders(): AdminOverview['providers'] {
  return [
    { id: 'cliproxy', name: 'CLIProxyAPI Plus', status: 'operational' },
    { id: 'openai', name: 'OpenAI', status: 'operational' },
    { id: 'anthropic', name: 'Anthropic', status: 'operational' },
    { id: 'google', name: 'Google', status: 'degraded' },
  ];
}
