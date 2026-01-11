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
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('\n📧 Email Verification Test Script\n');
    console.log('Usage:');
    console.log('  node test-email-verification.mjs get-token <email>');
    console.log('  node test-email-verification.mjs check-user <email>');
    console.log('  node test-email-verification.mjs list-unverified\n');
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  switch (command) {
    case 'get-token': {
      const email = args[1];
      if (!email) {
        console.error('❌ Error: Email required');
        console.log('Usage: node test-email-verification.mjs get-token <email>');
        break;
      }

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true,
          verificationToken: true,
          verificationTokenExpiry: true,
        },
      });

      if (!user) {
        console.log(`\n❌ No user found with email: ${email}\n`);
        break;
      }

      console.log('\n📋 User Information:\n');
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Verified: ${user.emailVerified ? '✅ Yes' : '❌ No'}`);
      console.log(`Token: ${user.verificationToken || '(none)'}`);
      console.log(
        `Expires: ${user.verificationTokenExpiry ? user.verificationTokenExpiry.toLocaleString() : '(none)'}`
      );

      if (user.verificationToken && !user.emailVerified) {
        const verificationUrl = `http://localhost:3000/verify-email?token=${user.verificationToken}`;
        console.log('\n🔗 Verification URL:\n');
        console.log(verificationUrl);
        console.log('\n💡 Copy this URL and paste it in your browser to verify the email.\n');
      } else if (user.emailVerified) {
        console.log('\n✅ This user is already verified!\n');
      } else {
        console.log('\n⚠️  No verification token found for this user.\n');
      }
      break;
    }

    case 'check-user': {
      const email = args[1];
      if (!email) {
        console.error('❌ Error: Email required');
        console.log('Usage: node test-email-verification.mjs check-user <email>');
        break;
      }

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true,
          createdAt: true,
        },
      });

      if (!user) {
        console.log(`\n❌ No user found with email: ${email}\n`);
        break;
      }

      console.log('\n📋 User Status:\n');
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Email Verified: ${user.emailVerified ? '✅ Yes' : '❌ No'}`);
      console.log(`Registered: ${user.createdAt.toLocaleString()}\n`);
      break;
    }

    case 'list-unverified': {
      const users = await prisma.user.findMany({
        where: { emailVerified: false },
        select: {
          email: true,
          name: true,
          verificationToken: true,
          verificationTokenExpiry: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      if (users.length === 0) {
        console.log('\n✅ No unverified users found.\n');
        break;
      }

      console.log(`\n📧 Unverified Users (${users.length}):\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   Created: ${user.createdAt.toLocaleString()}`);
        console.log(
          `   Token expires: ${user.verificationTokenExpiry ? user.verificationTokenExpiry.toLocaleString() : 'N/A'}`
        );
        if (user.verificationToken) {
          const url = `http://localhost:3000/verify-email?token=${user.verificationToken}`;
          console.log(`   Verification URL: ${url}`);
        }
        console.log('');
      });
      break;
    }

    default:
      console.log(`\n❌ Unknown command: ${command}\n`);
      console.log('Available commands:');
      console.log('  get-token <email>    - Get verification URL for a user');
      console.log('  check-user <email>   - Check verification status');
      console.log('  list-unverified      - List all unverified users\n');
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
