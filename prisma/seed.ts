import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Prisma adapter for PostgreSQL
const adapter = new PrismaPg(pool);

// Prisma 7.x requires adapter for direct database connections
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Seed subscription plans
  console.log('Creating subscription plans...');

  const basicPlan = await prisma.subscriptionPlan.upsert({
    where: { id: 'basic-monthly' },
    update: {},
    create: {
      id: 'basic-monthly',
      name: 'Plan Básico',
      description: 'Plan mensual básico con acceso a las funciones esenciales del estudio',
      price: 999000, // 9,990 CLP in cents (9,990 * 100)
      interval: 'monthly',
      features: [
        'Reservas ilimitadas',
        'Acceso a calendario compartido',
        'Notificaciones por email',
        'Soporte por email',
      ],
      isActive: true,
    },
  });

  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { id: 'pro-monthly' },
    update: {},
    create: {
      id: 'pro-monthly',
      name: 'Plan Pro',
      description: 'Plan mensual profesional con todas las funciones avanzadas',
      price: 1999000, // 19,990 CLP in cents (19,990 * 100)
      interval: 'monthly',
      features: [
        'Todo lo del Plan Básico',
        'Prioridad en reservas',
        'Acceso a estadísticas avanzadas',
        'Integración con calendario externo',
        'Soporte prioritario 24/7',
        'API access',
      ],
      isActive: true,
    },
  });

  console.log('✅ Created subscription plans:', {
    basic: basicPlan.name,
    pro: proPlan.name,
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
