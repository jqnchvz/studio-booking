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
  console.log('🔄 Backfilling user roles from isAdmin/isOwner...');

  // Admin users get role='admin'
  const adminResult = await prisma.$executeRaw`
    UPDATE users SET role = 'admin' WHERE "isAdmin" = true
  `;
  console.log(`  ✅ ${adminResult} user(s) set to admin`);

  // Owner users (who are not admin) get role='owner'
  const ownerResult = await prisma.$executeRaw`
    UPDATE users SET role = 'owner' WHERE "isOwner" = true AND "isAdmin" = false
  `;
  console.log(`  ✅ ${ownerResult} user(s) set to owner`);

  // Remaining users already have role='user' (the default)
  const userCount = await prisma.user.count({ where: { role: 'user' } });
  console.log(`  ✅ ${userCount} user(s) remain as regular users`);

  console.log('\n✅ Backfill complete!');
}

main()
  .catch((e) => {
    console.error('❌ Backfill failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
