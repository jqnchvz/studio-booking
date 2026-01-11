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
  console.log('\n📊 Fetching users from database...\n');

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (users.length === 0) {
    console.log('❌ No users found in the database.');
  } else {
    console.log(`✅ Found ${users.length} user(s):\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email Verified: ${user.emailVerified ? '✓' : '✗'}`);
      console.log(`   Created: ${user.createdAt.toLocaleString()}`);
      console.log(`   Updated: ${user.updatedAt.toLocaleString()}`);
      console.log('');
    });
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
