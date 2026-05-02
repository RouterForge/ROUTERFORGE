/**
 * Prisma seed script.
 * Run with: pnpm db:seed
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PLANS, calcPrice } from '../src/lib/plans';
import { MODELS } from '../src/lib/models';

const db = new PrismaClient();

/**
 * Indicative daily request quota per plan. Used for display / soft limits.
 * These are intentionally generous and can be tuned without a migration.
 */
const QUOTA_PER_DAY: Record<string, number> = {
  opensource: 3_000,
  gemini: 4_000,
  gpt: 5_000,
  claude: 5_000,
  bundle: 12_000,
};

async function main() {
  // Plans — prices are derived from baseMonth so the DB stays consistent with the UI.
  for (const plan of PLANS) {
    const daily = calcPrice(plan.baseMonth, 1, 0);
    const weekly = calcPrice(plan.baseMonth, 7, 0.1);
    const monthly = calcPrice(plan.baseMonth, 30, 0);
    const yearly = calcPrice(plan.baseMonth, 365, 0.35);

    const data = {
      id: plan.id,
      name: plan.name,
      tagline: plan.subtitle,
      families: JSON.stringify(plan.families),
      requestsPerDay: QUOTA_PER_DAY[plan.id] ?? 3_000,
      priceDaily: daily,
      priceWeekly: weekly,
      priceMonthly: monthly,
      priceYearly: yearly,
      badge: plan.badge ?? null,
    };

    await db.plan.upsert({
      where: { id: plan.id },
      create: data,
      update: data,
    });
  }

  // Providers
  for (const family of new Set(MODELS.map((m) => m.provider))) {
    await db.provider.upsert({
      where: { id: family },
      create: { id: family, name: family, status: 'operational' },
      update: {},
    });
  }

  // Bootstrap admin
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL ?? 'admin@routerforge.example';
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD ?? 'changeme-now';
  const hashed = await bcrypt.hash(password, 10);
  await db.user.upsert({
    where: { email },
    create: {
      email,
      name: 'RouterForge Admin',
      role: 'SUPER_ADMIN',
      hashedPassword: hashed,
    },
    update: {},
  });

  console.log(`Seeded ${PLANS.length} plans and bootstrap admin: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
