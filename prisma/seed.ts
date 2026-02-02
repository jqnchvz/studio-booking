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
      price: 9990, // 9,990 CLP (Chilean Pesos don't use cents)
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
      price: 19990, // 19,990 CLP (Chilean Pesos don't use cents)
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

  // Seed resources (studio rooms)
  console.log('Creating resources...');

  const studioA = await prisma.resource.upsert({
    where: { id: 'studio-a' },
    update: {},
    create: {
      id: 'studio-a',
      name: 'Estudio A',
      description: 'Sala principal de grabación con aislamiento acústico profesional',
      type: 'room',
      capacity: 6,
      metadata: {
        equipment: ['Consola de mezcla', 'Monitores de estudio', 'Micrófonos'],
        area: '25m²',
      },
    },
  });

  const studioB = await prisma.resource.upsert({
    where: { id: 'studio-b' },
    update: {},
    create: {
      id: 'studio-b',
      name: 'Estudio B',
      description: 'Sala de ensayo equipada para bandas y grupos',
      type: 'room',
      capacity: 10,
      metadata: {
        equipment: ['Batería', 'Amplificadores', 'Sistema PA'],
        area: '40m²',
      },
    },
  });

  const studioC = await prisma.resource.upsert({
    where: { id: 'studio-c' },
    update: {},
    create: {
      id: 'studio-c',
      name: 'Sala de Producción',
      description: 'Sala de producción musical con estación de trabajo completa',
      type: 'room',
      capacity: 3,
      metadata: {
        equipment: ['DAW', 'Controlador MIDI', 'Monitores de campo cercano'],
        area: '15m²',
      },
    },
  });

  console.log('✅ Created resources:', {
    studioA: studioA.name,
    studioB: studioB.name,
    studioC: studioC.name,
  });

  // Seed resource availability (Mon-Sat, 9:00-22:00)
  console.log('Creating resource availability...');

  const resources = [studioA, studioB, studioC];
  // Days 1-6 = Monday-Saturday (no Sunday)
  const workDays = [1, 2, 3, 4, 5, 6];

  for (const resource of resources) {
    for (const day of workDays) {
      await prisma.resourceAvailability.upsert({
        where: { id: `${resource.id}-day-${day}` },
        update: {},
        create: {
          id: `${resource.id}-day-${day}`,
          resourceId: resource.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '22:00',
        },
      });
    }
  }

  console.log('✅ Created availability for', resources.length, 'resources ×', workDays.length, 'days');

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
