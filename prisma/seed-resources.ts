import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const db = new PrismaClient({
  adapter,
  log: ['error'],
});

async function seedResources() {
  console.log('🌱 Seeding resources...');

  // Create Studio A - Available Monday to Friday
  const studioA = await db.resource.create({
    data: {
      name: 'Sala de Estudio A',
      type: 'room',
      description: 'Sala amplia con pizarra y proyector',
      capacity: 10,
      isActive: true,
      availability: {
        create: [
          // Monday (1)
          {
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '18:00',
            isActive: true,
          },
          // Tuesday (2)
          {
            dayOfWeek: 2,
            startTime: '09:00',
            endTime: '18:00',
            isActive: true,
          },
          // Wednesday (3)
          {
            dayOfWeek: 3,
            startTime: '09:00',
            endTime: '18:00',
            isActive: true,
          },
          // Thursday (4)
          {
            dayOfWeek: 4,
            startTime: '09:00',
            endTime: '18:00',
            isActive: true,
          },
          // Friday (5)
          {
            dayOfWeek: 5,
            startTime: '09:00',
            endTime: '18:00',
            isActive: true,
          },
        ],
      },
    },
  });

  console.log(`✅ Created: ${studioA.name}`);

  // Create Studio B - Available all week
  const studioB = await db.resource.create({
    data: {
      name: 'Sala de Estudio B',
      type: 'room',
      description: 'Sala pequeña ideal para reuniones',
      capacity: 6,
      isActive: true,
      availability: {
        create: [
          // Monday (1)
          {
            dayOfWeek: 1,
            startTime: '10:00',
            endTime: '20:00',
            isActive: true,
          },
          // Tuesday (2)
          {
            dayOfWeek: 2,
            startTime: '10:00',
            endTime: '20:00',
            isActive: true,
          },
          // Wednesday (3)
          {
            dayOfWeek: 3,
            startTime: '10:00',
            endTime: '20:00',
            isActive: true,
          },
          // Thursday (4)
          {
            dayOfWeek: 4,
            startTime: '10:00',
            endTime: '20:00',
            isActive: true,
          },
          // Friday (5)
          {
            dayOfWeek: 5,
            startTime: '10:00',
            endTime: '20:00',
            isActive: true,
          },
          // Saturday (6)
          {
            dayOfWeek: 6,
            startTime: '12:00',
            endTime: '18:00',
            isActive: true,
          },
          // Sunday (0)
          {
            dayOfWeek: 0,
            startTime: '12:00',
            endTime: '18:00',
            isActive: true,
          },
        ],
      },
    },
  });

  console.log(`✅ Created: ${studioB.name}`);

  // Create Meeting Room - Available weekdays
  const meetingRoom = await db.resource.create({
    data: {
      name: 'Sala de Reuniones',
      type: 'meeting_room',
      description: 'Sala de reuniones con videoconferencia',
      capacity: 8,
      isActive: true,
      availability: {
        create: [
          // Monday (1)
          {
            dayOfWeek: 1,
            startTime: '08:00',
            endTime: '19:00',
            isActive: true,
          },
          // Tuesday (2)
          {
            dayOfWeek: 2,
            startTime: '08:00',
            endTime: '19:00',
            isActive: true,
          },
          // Wednesday (3)
          {
            dayOfWeek: 3,
            startTime: '08:00',
            endTime: '19:00',
            isActive: true,
          },
          // Thursday (4)
          {
            dayOfWeek: 4,
            startTime: '08:00',
            endTime: '19:00',
            isActive: true,
          },
          // Friday (5)
          {
            dayOfWeek: 5,
            startTime: '08:00',
            endTime: '19:00',
            isActive: true,
          },
        ],
      },
    },
  });

  console.log(`✅ Created: ${meetingRoom.name}`);

  // Create Projector - Available all week
  const projector = await db.resource.create({
    data: {
      name: 'Proyector Portátil',
      type: 'equipment',
      description: 'Proyector HD portátil',
      capacity: null,
      isActive: true,
      availability: {
        create: [
          // Monday to Sunday - all day
          ...Array.from({ length: 7 }, (_, i) => ({
            dayOfWeek: i,
            startTime: '08:00',
            endTime: '20:00',
            isActive: true,
          })),
        ],
      },
    },
  });

  console.log(`✅ Created: ${projector.name}`);

  console.log('\n✅ Resource seeding completed!');
  console.log(`Total resources created: 4`);
}

seedResources()
  .catch((e) => {
    console.error('❌ Error seeding resources:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
