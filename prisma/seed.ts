/**
 * Prisma seed script.
 * Run with: pnpm db:seed
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PLANS } from '../src/lib/plans';
import { MODELS } from '../src/lib/models';

const db = new PrismaClient();

async function main() {
  // Plans
  for (const plan of PLANS) {
    await db.plan.upsert({
      where: { id: plan.id },
      create: {
        id: plan.id,
        name: plan.name,
        tagline: plan.tagline,
        families: JSON.stringify(plan.families),
        requestsPerDay: plan.requestsPerDay,
        priceDaily: plan.prices.daily,
        priceWeekly: plan.prices.weekly,
        priceMonthly: plan.prices.monthly,
        priceYearly: plan.prices.yearly,
        badge: plan.badge ?? null,
      },
      update: {
        name: plan.name,
        tagline: plan.tagline,
        families: JSON.stringify(plan.families),
        requestsPerDay: plan.requestsPerDay,
        priceDaily: plan.prices.daily,
        priceWeekly: plan.prices.weekly,
        priceMonthly: plan.prices.monthly,
        priceYearly: plan.prices.yearly,
        badge: plan.badge ?? null,
      },
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
