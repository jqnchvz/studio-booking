import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🏗️  Migrating to multi-tenant schema...');

  // 1. Find the first admin user — they become the default org owner
  const adminUser = await prisma.user.findFirst({
    where: { isAdmin: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!adminUser) {
    throw new Error('No admin user found. Run the seed script first.');
  }

  console.log(`👤 Admin user: ${adminUser.email}`);

  // 2. Create (or find) the default organization — upsert makes this idempotent
  const defaultOrg = await prisma.organization.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Default Organization',
      slug: 'default',
      status: 'active',
      ownerId: adminUser.id,
    },
  });

  console.log(`🏢 Default org: ${defaultOrg.id}`);

  // 3. Ensure OrganizationSettings exists for the default org
  await prisma.organizationSettings.upsert({
    where: { organizationId: defaultOrg.id },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      timezone: 'America/Santiago',
    },
  });

  console.log('⚙️  OrganizationSettings ensured');

  // 4. Backfill existing Resources — only rows not yet assigned to any org
  const { count: resourceCount } = await prisma.resource.updateMany({
    where: { organizationId: null },
    data: { organizationId: defaultOrg.id },
  });

  console.log(`📦 Migrated ${resourceCount} resource(s) → default org`);

  // 5. Backfill existing SubscriptionPlans — only rows not yet assigned
  const { count: planCount } = await prisma.subscriptionPlan.updateMany({
    where: { organizationId: null },
    data: { organizationId: defaultOrg.id },
  });

  console.log(`📋 Migrated ${planCount} subscription plan(s) → default org`);

  console.log('\n✅ Migration complete!');
  console.log(`   Organization ID : ${defaultOrg.id}`);
  console.log(`   Owner           : ${adminUser.email}`);
  console.log(`   Resources       : ${resourceCount} migrated`);
  console.log(`   Plans           : ${planCount} migrated`);
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
