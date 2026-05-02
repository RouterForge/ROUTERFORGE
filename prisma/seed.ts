/**
 * Prisma seed script.
 * Run with: pnpm db:seed
 *
 * This is a destructive seed: every existing user / subscription / payment /
 * api key / activation code / usage event / audit log / abuse flag /
 * support ticket / blog post is wiped and replaced with a clean baseline of
 *   - 1 SUPER_ADMIN
 *   - 1 USER
 * and ~30 days of realistic usage events tied to the demo user.
 *
 * The defaults below can be overridden via env vars:
 *   ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD
 *   USER_BOOTSTRAP_EMAIL  / USER_BOOTSTRAP_PASSWORD
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { PLANS, calcPrice } from '../src/lib/plans';
import { MODELS } from '../src/lib/models';

const db = new PrismaClient();

const QUOTA_PER_DAY: Record<string, number> = {
  opensource: 3_000,
  gemini: 4_000,
  gpt: 5_000,
  claude: 5_000,
  bundle: 12_000,
};

const ADMIN_EMAIL = process.env.ADMIN_BOOTSTRAP_EMAIL ?? 'admin@routerforge.io';
const ADMIN_PASSWORD = process.env.ADMIN_BOOTSTRAP_PASSWORD ?? 'Admin#2025!';
const USER_EMAIL = process.env.USER_BOOTSTRAP_EMAIL ?? 'demo@routerforge.io';
const USER_PASSWORD = process.env.USER_BOOTSTRAP_PASSWORD ?? 'Demo#2025!';

/* -----------------------------------------------------------------------
 * 1. Reset
 * -------------------------------------------------------------------- */

async function wipe() {
  // Order matters: delete child rows before parents.
  // Many of these cascade on User delete, but listing them explicitly keeps
  // the script idempotent across schema changes.
  await db.message.deleteMany({});
  await db.conversation.deleteMany({});
  await db.usageEvent.deleteMany({});
  await db.payment.deleteMany({});
  await db.apiKey.deleteMany({});
  await db.subscription.deleteMany({});
  await db.abuseFlag.deleteMany({});
  await db.supportTicket.deleteMany({});
  await db.notificationPreference.deleteMany({});
  await db.adminAuditLog.deleteMany({});
  await db.activationCode.deleteMany({});
  await db.user.deleteMany({});
  await db.blogPost.deleteMany({});
}

/* -----------------------------------------------------------------------
 * 2. Plans + providers (config rows that should always exist)
 * -------------------------------------------------------------------- */

async function upsertPlans() {
  for (const plan of PLANS) {
    const data = {
      id: plan.id,
      name: plan.name,
      tagline: plan.subtitle,
      families: JSON.stringify(plan.families),
      requestsPerDay: QUOTA_PER_DAY[plan.id] ?? 3_000,
      priceDaily: calcPrice(plan.baseMonth, 1, 0),
      priceWeekly: calcPrice(plan.baseMonth, 7, 0.1),
      priceMonthly: calcPrice(plan.baseMonth, 30, 0),
      priceYearly: calcPrice(plan.baseMonth, 365, 0.35),
      badge: plan.badge ?? null,
    };
    await db.plan.upsert({ where: { id: plan.id }, create: data, update: data });
  }

  for (const provider of new Set(MODELS.map((m) => m.provider))) {
    await db.provider.upsert({
      where: { id: provider },
      create: { id: provider, name: provider, status: 'operational' },
      update: {},
    });
  }
}

/* -----------------------------------------------------------------------
 * 3. Accounts
 * -------------------------------------------------------------------- */

async function createAdmin() {
  return db.user.create({
    data: {
      email: ADMIN_EMAIL,
      name: 'RouterForge Admin',
      role: 'SUPER_ADMIN',
      hashedPassword: await bcrypt.hash(ADMIN_PASSWORD, 10),
      locale: 'en',
      theme: 'dark',
      emailVerifiedAt: new Date(),
      notifications: {
        create: {
          emailUsageAlerts: true,
          emailBilling: true,
          emailProductNews: false,
        },
      },
    },
  });
}

async function createUser() {
  return db.user.create({
    data: {
      email: USER_EMAIL,
      name: 'Demo User',
      role: 'USER',
      hashedPassword: await bcrypt.hash(USER_PASSWORD, 10),
      locale: 'en',
      theme: 'system',
      emailVerifiedAt: new Date(),
      notifications: {
        create: {
          emailUsageAlerts: true,
          emailBilling: true,
          emailProductNews: true,
        },
      },
    },
  });
}

/* -----------------------------------------------------------------------
 * 4. Subscription + payment history for the demo user
 * -------------------------------------------------------------------- */

async function createSubscriptionAndPayments(userId: string) {
  const plan = PLANS.find((p) => p.id === 'gpt')!; // most representative plan

  // Active monthly subscription that started 12 days ago and ends 18 days from now.
  const startsAt = new Date(Date.now() - 12 * 86400_000);
  const endsAt = new Date(startsAt.getTime() + 30 * 86400_000);

  const subscription = await db.subscription.create({
    data: {
      userId,
      planId: plan.id,
      cycle: 'monthly',
      status: 'ACTIVE',
      startsAt,
      endsAt,
    },
  });

  // Three SUCCEEDED payments so the billing page has invoice history.
  const payments = [
    { offsetDays: -12, amount: plan.baseMonth, provider: 'POLAR' as const },
    { offsetDays: -42, amount: plan.baseMonth, provider: 'POLAR' as const },
    { offsetDays: -72, amount: plan.baseMonth, provider: 'BINANCE' as const },
  ];
  for (const p of payments) {
    await db.payment.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        provider: p.provider,
        status: 'SUCCEEDED',
        amount: p.amount,
        currency: 'USD',
        externalId: `seed_${crypto.randomBytes(6).toString('hex')}`,
        createdAt: new Date(Date.now() + p.offsetDays * 86400_000),
        updatedAt: new Date(Date.now() + p.offsetDays * 86400_000),
      },
    });
  }

  return subscription;
}

/* -----------------------------------------------------------------------
 * 5. API keys for the demo user
 * -------------------------------------------------------------------- */

async function createApiKeys(userId: string) {
  function makeKey(prefix: string) {
    const raw = `${prefix}_${crypto.randomBytes(28).toString('hex')}`;
    return { raw, hash: crypto.createHash('sha256').update(raw).digest('hex'), prefix: raw.slice(0, 12) };
  }
  const k1 = makeKey('rf_live');
  const k2 = makeKey('rf_live');

  await db.apiKey.create({
    data: {
      userId,
      name: 'Production',
      prefix: k1.prefix,
      hash: k1.hash,
      lastUsedAt: new Date(Date.now() - 2 * 3_600_000),
    },
  });
  await db.apiKey.create({
    data: {
      userId,
      name: 'Local development',
      prefix: k2.prefix,
      hash: k2.hash,
      lastUsedAt: new Date(Date.now() - 6 * 86400_000),
    },
  });
  return [k1, k2];
}

/* -----------------------------------------------------------------------
 * 6. Realistic usage events (~30 days)
 *
 * We sample requests with:
 *   - heavier traffic on weekdays (Mon–Fri)
 *   - business-hour bias (peaks 9–18 UTC)
 *   - a weighted model mix anchored on GPT-4o mini for cost efficiency
 *   - input ~ N(900, 400), output ~ N(450, 200)
 *   - latency derived from each model's relative speed score
 *   - 97% success rate
 * -------------------------------------------------------------------- */

async function createUsageEvents(userId: string, subscriptionId: string, apiKeyId: string) {
  const eligible = MODELS.filter((m) => ['openai', 'oss', 'claude', 'gemini'].includes(m.family));
  const weights = new Map<string, number>([
    ['gpt-4o-mini', 6],
    ['gpt-4o', 3],
    ['o1', 0.6],
    ['codex-latest', 1.2],
    ['claude-3-5-sonnet', 2],
    ['claude-3-5-haiku', 1.4],
    ['claude-3-opus', 0.4],
    ['gemini-2-0-pro', 1.5],
    ['gemini-2-0-flash', 2.4],
    ['llama-3-1-70b', 0.8],
    ['qwen-2-5-72b', 0.5],
    ['deepseek-v3', 0.9],
  ]);
  const weighted = eligible.flatMap((m) => {
    const w = weights.get(m.id) ?? 0.5;
    return Array.from({ length: Math.round(w * 20) }, () => m);
  });

  const events: any[] = [];
  const now = Date.now();

  // Use a deterministic RNG so the seed is reproducible.
  let rngState = 0xc0ffee;
  const rng = () => {
    rngState = (rngState * 1664525 + 1013904223) >>> 0;
    return rngState / 0xffffffff;
  };
  const gauss = (mean: number, std: number) => {
    // Box-Muller
    const u = Math.max(rng(), 1e-9);
    const v = rng();
    return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  for (let day = 29; day >= 0; day--) {
    const date = new Date(now - day * 86400_000);
    const dow = date.getUTCDay(); // 0=Sun, 6=Sat
    const isWeekend = dow === 0 || dow === 6;
    // 80–180 events on weekdays, 30–80 on weekends.
    const requestCount = Math.round((isWeekend ? 30 + rng() * 50 : 80 + rng() * 100));

    for (let i = 0; i < requestCount; i++) {
      // Business-hour weighted hour-of-day: peak at 13 UTC, std 4h.
      let hour = Math.round(gauss(13, 4));
      hour = Math.max(0, Math.min(23, hour));
      const minute = Math.floor(rng() * 60);
      const second = Math.floor(rng() * 60);
      const ts = new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hour, minute, second),
      );

      const model = weighted[Math.floor(rng() * weighted.length)];
      const inputTokens = Math.max(40, Math.round(gauss(900, 400)));
      const outputTokens = Math.max(20, Math.round(gauss(450, 200)));
      const baseLatency = 1800 - model.speed * 120; // faster model -> lower latency
      const latencyMs = Math.max(120, Math.round(baseLatency + gauss(0, 220)));
      const success = rng() > 0.03; // 97%
      events.push({
        userId,
        apiKeyId,
        subscriptionId,
        modelId: model.id,
        endpoint: '/v1/chat/completions',
        latencyMs,
        inputTokens,
        outputTokens,
        success,
        errorCode: success ? null : 'upstream_timeout',
        createdAt: ts,
      });
    }
  }

  // SQLite caps parameters per query; chunk inserts.
  const CHUNK = 500;
  for (let i = 0; i < events.length; i += CHUNK) {
    await db.usageEvent.createMany({ data: events.slice(i, i + CHUNK) });
  }

  return events.length;
}

/* -----------------------------------------------------------------------
 * 7. Misc: activation codes, audit log, abuse flag, support ticket, blog
 * -------------------------------------------------------------------- */

function genCode(): string {
  const part = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `RF-${part()}-${part()}-${part()}`;
}

async function createMisc(adminId: string, userId: string) {
  // 5 activation codes — 1 already redeemed, 4 still available.
  const codes = [
    { plan: 'opensource', cycle: 'monthly', durationDays: 30, redeemed: false, note: 'Newsletter giveaway' },
    { plan: 'gpt', cycle: 'monthly', durationDays: 30, redeemed: true, note: 'Beta tester' },
    { plan: 'claude', cycle: 'monthly', durationDays: 30, redeemed: false, note: 'Twitter promo' },
    { plan: 'bundle', cycle: 'yearly', durationDays: 365, redeemed: false, note: 'Conference giveaway' },
    { plan: 'gemini', cycle: 'weekly', durationDays: 7, redeemed: false, note: 'Trial' },
  ];
  for (const c of codes) {
    await db.activationCode.create({
      data: {
        code: genCode(),
        planId: c.plan,
        cycle: c.cycle,
        durationDays: c.durationDays,
        note: c.note,
        createdById: adminId,
        expiresAt: new Date(Date.now() + 90 * 86400_000),
        ...(c.redeemed
          ? {
              redeemedById: userId,
              redeemedAt: new Date(Date.now() - 14 * 86400_000),
            }
          : {}),
      },
    });
  }

  // A handful of admin audit events showing real activity.
  const auditEntries = [
    { actorId: adminId, action: 'admin.user.list', metadata: { count: 2 } },
    { actorId: adminId, action: 'admin.code.generate', metadata: { count: 5 } },
    { actorId: adminId, action: 'admin.code.redeemed', targetType: 'ActivationCode' },
    { actorId: userId, action: 'auth.sign_in', ip: '203.0.113.42' },
    { actorId: userId, action: 'apikey.create', targetType: 'ApiKey', metadata: { name: 'Production' } },
    { actorId: userId, action: 'apikey.create', targetType: 'ApiKey', metadata: { name: 'Local development' } },
    { actorId: userId, action: 'subscription.create', metadata: { planId: 'gpt', cycle: 'monthly' } },
    { actorId: userId, action: 'billing.payment.success', metadata: { provider: 'POLAR', amount: 14.99 } },
  ];
  for (let i = 0; i < auditEntries.length; i++) {
    const e = auditEntries[i];
    await db.adminAuditLog.create({
      data: {
        actorId: e.actorId,
        action: e.action,
        targetType: (e as any).targetType ?? null,
        metadata: 'metadata' in e ? JSON.stringify((e as any).metadata) : null,
        ip: (e as any).ip ?? null,
        createdAt: new Date(Date.now() - i * 3_600_000),
      },
    });
  }

  // A low-severity abuse flag for the demo user (already resolved).
  await db.abuseFlag.create({
    data: {
      userId,
      severity: 'LOW',
      reason: 'Spike +180% above baseline (auto-detected)',
      resolved: true,
      createdAt: new Date(Date.now() - 5 * 86400_000),
    },
  });

  // One resolved support ticket from the user.
  await db.supportTicket.create({
    data: {
      userId,
      subject: 'Question about yearly upgrade discount',
      body:
        "Hi! I love the platform. If I upgrade to the yearly plan now, do you " +
        'pro-rate the days I have left on my monthly?',
      status: 'RESOLVED',
      createdAt: new Date(Date.now() - 9 * 86400_000),
    },
  });

  // Blog posts so the /blog index reads from DB.
  const posts = [
    {
      slug: 'introducing-routerforge',
      title: 'Introducing RouterForge — one API for every frontier model',
      excerpt:
        'Why we built a multi-model AI subscription platform with first-class adapter support, and what comes next.',
      category: 'Product',
      tags: ['announcement', 'product'],
      publishedAt: new Date('2025-01-08'),
      featured: true,
    },
    {
      slug: 'smart-routing-presets',
      title: 'Smart routing presets: Fastest, Best Reasoning, Best Value',
      excerpt:
        'How we let you pick a routing strategy without locking you into a single model.',
      category: 'Engineering',
      tags: ['routing', 'engineering'],
      publishedAt: new Date('2025-01-15'),
    },
    {
      slug: 'why-time-based-pricing',
      title: 'Why we chose time-based pricing over per-token billing',
      excerpt: 'Predictable bills make it easier to ship — for solo builders and big teams alike.',
      category: 'Pricing',
      tags: ['pricing', 'product'],
      publishedAt: new Date('2025-01-22'),
    },
  ];
  for (const p of posts) {
    await db.blogPost.create({
      data: {
        slug: p.slug,
        locale: 'en',
        title: p.title,
        excerpt: p.excerpt,
        body:
          `# ${p.title}\n\n${p.excerpt}\n\n` +
          'This is real seed content. In production, blog posts come from your CMS.',
        category: p.category,
        tags: JSON.stringify(p.tags),
        featured: p.featured ?? false,
        publishedAt: p.publishedAt,
      },
    });
  }
}

/* -------------------------------------------------------------------- */

async function main() {
  console.log('Wiping existing data…');
  await wipe();

  console.log('Upserting plans + providers…');
  await upsertPlans();

  console.log('Creating accounts…');
  const admin = await createAdmin();
  const user = await createUser();

  console.log('Creating subscription + payments…');
  const subscription = await createSubscriptionAndPayments(user.id);

  console.log('Creating API keys…');
  const apiKeys = await createApiKeys(user.id);
  const firstKeyId = (await db.apiKey.findFirst({ where: { userId: user.id } }))!.id;

  console.log('Generating ~30 days of realistic usage events…');
  const eventCount = await createUsageEvents(user.id, subscription.id, firstKeyId);
  console.log(`  inserted ${eventCount} usage events`);

  console.log('Creating activation codes, audit log, abuse flag, ticket, blog posts…');
  await createMisc(admin.id, user.id);

  console.log('\n=== Seed complete ===');
  console.log('Super admin:');
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log('Demo user:');
  console.log(`  Email:    ${USER_EMAIL}`);
  console.log(`  Password: ${USER_PASSWORD}`);
  console.log(`  Plan:     GPT / Codex (monthly), ends ${subscription.endsAt.toISOString().slice(0, 10)}`);
  console.log(`  Keys:     ${apiKeys[0].raw.slice(0, 16)}…  ${apiKeys[1].raw.slice(0, 16)}…`);
  console.log('Note: API keys are hashed in the DB; the values printed here are the only place');
  console.log('      you can see them in plaintext. Re-run `pnpm db:seed` to rotate.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
