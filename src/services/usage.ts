import 'server-only';
import { db } from '@/lib/db';

export interface RecordUsageInput {
  userId: string;
  apiKeyId?: string | null;
  subscriptionId?: string | null;
  modelId: string;
  endpoint: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  success: boolean;
  errorCode?: string | null;
}

/**
 * Record a usage event. Silently swallows DB errors so provider calls never fail
 * just because the analytics insert failed.
 */
export async function recordUsage(input: RecordUsageInput): Promise<void> {
  try {
    await db.usageEvent.create({
      data: {
        userId: input.userId,
        apiKeyId: input.apiKeyId ?? null,
        subscriptionId: input.subscriptionId ?? null,
        modelId: input.modelId,
        endpoint: input.endpoint,
        latencyMs: input.latencyMs,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        success: input.success,
        errorCode: input.errorCode ?? null,
      },
    });
  } catch {
    // DB may not be initialized in dev; ignore.
  }
}

/** Find a user's most recent active subscription (for attribution). */
export async function getActiveSubscriptionId(userId: string): Promise<string | null> {
  try {
    const sub = await db.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { startsAt: 'desc' },
      select: { id: true },
    });
    return sub?.id ?? null;
  } catch {
    return null;
  }
}
