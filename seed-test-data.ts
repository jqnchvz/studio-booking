import { db } from './src/lib/db';
import { hashPassword } from './src/lib/services/auth.service';
import { subDays, addDays, subMonths, startOfMonth } from 'date-fns';

/**
 * Seed Test Data for Admin Dashboard Testing
 *
 * This script creates:
 * - 1 admin user (admin@test.com / admin123)
 * - 3 regular users
 * - 3 subscription plans
 * - 5 active subscriptions
 * - 30 payments (mix of approved/rejected, last 60 days)
 * - 2 resources
 * - 10 reservations (mix of past/upcoming)
 */

async function main() {
  console.log('🌱 Starting test data seeding...\n');

  // Step 1: Create or update admin user
  console.log('👑 Creating admin user...');
  const adminPassword = await hashPassword('admin123');

  const admin = await db.user.upsert({
    where: { email: 'admin@test.com' },
    update: {
      isAdmin: true,
      emailVerified: true,
    },
    create: {
      email: 'admin@test.com',
      passwordHash: adminPassword,
      name: 'Admin User',
      isAdmin: true,
      emailVerified: true,
    },
  });

  console.log(`   ✅ Admin: ${admin.email} (password: admin123)`);

  // Step 2: Create regular test users
  console.log('\n👥 Creating test users...');
  const userPassword = await hashPassword('test123');

  const users = await Promise.all([
    db.user.upsert({
      where: { email: 'user1@test.com' },
      update: { emailVerified: true },
      create: {
        email: 'user1@test.com',
        passwordHash: userPassword,
        name: 'María González',
        emailVerified: true,
      },
    }),
    db.user.upsert({
      where: { email: 'user2@test.com' },
      update: { emailVerified: true },
      create: {
        email: 'user2@test.com',
        passwordHash: userPassword,
        name: 'Juan Pérez',
        emailVerified: true,
      },
    }),
    db.user.upsert({
      where: { email: 'user3@test.com' },
      update: { emailVerified: true },
      create: {
        email: 'user3@test.com',
        passwordHash: userPassword,
        name: 'Ana Martínez',
        emailVerified: true,
      },
    }),
  ]);

  console.log(`   ✅ Created ${users.length} test users (password: test123)`);

  // Step 3: Ensure subscription plans exist
  console.log('\n📋 Checking subscription plans...');
  let plans = await db.subscriptionPlan.findMany();

  if (plans.length === 0) {
    console.log('   Creating subscription plans...');
    plans = await Promise.all([
      db.subscriptionPlan.create({
        data: {
          name: 'Plan Básico',
          description: 'Plan de entrada con acceso limitado',
          price: 10000,
          interval: 'monthly',
          features: ['Acceso básico', 'Hasta 5 reservas por mes'],
          isActive: true,
        },
      }),
      db.subscriptionPlan.create({
        data: {
          name: 'Plan Premium',
          description: 'Plan completo con todas las funcionalidades',
          price: 25000,
          interval: 'monthly',
          features: ['Acceso completo', 'Reservas ilimitadas', 'Soporte prioritario'],
          isActive: true,
        },
      }),
      db.subscriptionPlan.create({
        data: {
          name: 'Plan Pro',
          description: 'Plan profesional para uso intensivo',
          price: 45000,
          interval: 'monthly',
          features: ['Todo lo de Premium', 'Múltiples recursos simultáneos', 'Gestor de cuenta dedicado'],
          isActive: true,
        },
      }),
    ]);
  }

  console.log(`   ✅ ${plans.length} subscription plans available`);

  // Step 4: Create active subscriptions
  console.log('\n💳 Creating active subscriptions...');

  // Delete existing test data to avoid conflicts
  // Must delete payments first due to foreign key constraint
  await db.payment.deleteMany({
    where: {
      userId: {
        in: users.map(u => u.id),
      },
    },
  });

  await db.subscription.deleteMany({
    where: {
      userId: {
        in: users.map(u => u.id),
      },
    },
  });

  const subscriptions = await Promise.all(
    users.map((user, index) => {
      const now = new Date();
      const periodStart = subDays(now, 15); // Current period started 15 days ago
      const periodEnd = addDays(now, 15); // Current period ends in 15 days
      const nextBilling = addDays(now, 15); // Next billing in 15 days

      return db.subscription.create({
        data: {
          userId: user.id,
          planId: plans[index % plans.length].id,
          planPrice: plans[index % plans.length].price,
          status: 'active',
          mercadopagoSubId: `test-sub-${user.id}`,
          nextBillingDate: nextBilling,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
      });
    })
  );

  console.log(`   ✅ Created ${subscriptions.length} active subscriptions`);

  // Step 5: Create payment history (last 60 days)
  console.log('\n💰 Creating payment history...');

  const payments = [];
  const now = new Date();

  // Create payments for each month (last 3 months)
  for (let monthsAgo = 0; monthsAgo < 3; monthsAgo++) {
    const monthDate = subMonths(startOfMonth(now), monthsAgo);

    // 8-12 payments per month
    const paymentsThisMonth = Math.floor(Math.random() * 5) + 8;

    for (let i = 0; i < paymentsThisMonth; i++) {
      const userIndex = i % users.length;
      const user = users[userIndex];
      const subscription = subscriptions[userIndex];
      const plan = plans[i % plans.length];

      // Random date within the month
      const daysInMonth = 28;
      const randomDay = Math.floor(Math.random() * daysInMonth);
      const paymentDate = addDays(monthDate, randomDay);

      // 85% approved, 15% rejected (realistic success rate)
      const isApproved = Math.random() < 0.85;

      const payment = await db.payment.create({
        data: {
          userId: user.id,
          subscriptionId: subscription.id,
          mercadopagoId: `test-pay-${Date.now()}-${i}-${monthsAgo}`,
          amount: plan.price,
          penaltyFee: 0,
          totalAmount: plan.price,
          status: isApproved ? 'approved' : 'rejected',
          dueDate: paymentDate,
          paidAt: isApproved ? paymentDate : null,
          createdAt: paymentDate,
          updatedAt: paymentDate,
        },
      });

      payments.push(payment);
    }
  }

  const approvedCount = payments.filter(p => p.status === 'approved').length;
  const rejectedCount = payments.filter(p => p.status === 'rejected').length;

  console.log(`   ✅ Created ${payments.length} payments`);
  console.log(`      - Approved: ${approvedCount}`);
  console.log(`      - Rejected: ${rejectedCount}`);

  // Step 6: Create resources for reservations
  console.log('\n🏢 Creating resources...');

  const resources = await Promise.all([
    db.resource.upsert({
      where: { id: 'test-resource-1' },
      update: {},
      create: {
        id: 'test-resource-1',
        name: 'Sala de Ensayo A',
        type: 'rehearsal_room',
        capacity: 10,
        isActive: true,
      },
    }),
    db.resource.upsert({
      where: { id: 'test-resource-2' },
      update: {},
      create: {
        id: 'test-resource-2',
        name: 'Estudio de Grabación',
        type: 'recording_studio',
        capacity: 5,
        isActive: true,
      },
    }),
  ]);

  console.log(`   ✅ Created ${resources.length} resources`);

  // Step 7: Create reservations (mix of past and upcoming)
  console.log('\n📅 Creating reservations...');

  // Delete existing reservations for clean slate
  await db.reservation.deleteMany({
    where: {
      userId: {
        in: users.map(u => u.id),
      },
    },
  });

  const reservations = [];

  // Past reservations (completed)
  for (let i = 0; i < 3; i++) {
    const user = users[i % users.length];
    const resource = resources[i % resources.length];
    const daysAgo = 10 + i * 5;

    const reservation = await db.reservation.create({
      data: {
        userId: user.id,
        resourceId: resource.id,
        title: `Ensayo ${i + 1}`,
        description: 'Sesión de práctica',
        startTime: subDays(now, daysAgo),
        endTime: subDays(addDays(now, 0), daysAgo - 1),
        attendees: Math.floor(Math.random() * 5) + 2,
        status: 'completed',
      },
    });

    reservations.push(reservation);
  }

  // Upcoming reservations (confirmed)
  for (let i = 0; i < 5; i++) {
    const user = users[i % users.length];
    const resource = resources[i % resources.length];
    const daysFromNow = i + 2;

    const reservation = await db.reservation.create({
      data: {
        userId: user.id,
        resourceId: resource.id,
        title: `Reserva ${i + 1}`,
        description: 'Sesión programada',
        startTime: addDays(now, daysFromNow),
        endTime: addDays(now, daysFromNow + 1),
        attendees: Math.floor(Math.random() * 8) + 2,
        status: 'confirmed',
      },
    });

    reservations.push(reservation);
  }

  // Cancelled reservation
  const cancelledReservation = await db.reservation.create({
    data: {
      userId: users[0].id,
      resourceId: resources[0].id,
      title: 'Reserva Cancelada',
      description: 'Esta fue cancelada',
      startTime: addDays(now, 10),
      endTime: addDays(now, 11),
      attendees: 3,
      status: 'cancelled',
    },
  });

  reservations.push(cancelledReservation);

  console.log(`   ✅ Created ${reservations.length} reservations`);
  console.log(`      - Completed: 3`);
  console.log(`      - Upcoming: 5`);
  console.log(`      - Cancelled: 1`);

  // Summary
  console.log('\n📊 Database Seed Summary:\n');
  console.log(`✅ Admin User: admin@test.com (password: admin123)`);
  console.log(`✅ Regular Users: ${users.length} (password: test123)`);
  console.log(`   - ${users.map(u => u.email).join(', ')}`);
  console.log(`✅ Subscription Plans: ${plans.length}`);
  console.log(`✅ Active Subscriptions: ${subscriptions.length}`);
  console.log(`✅ Payment History: ${payments.length} payments`);
  console.log(`   - Success Rate: ${((approvedCount / payments.length) * 100).toFixed(1)}%`);
  console.log(`✅ Resources: ${resources.length}`);
  console.log(`✅ Reservations: ${reservations.length}`);

  console.log('\n🎉 Test data seeding complete!\n');
  console.log('📝 Next steps:');
  console.log('   1. Start dev server: npm run dev');
  console.log('   2. Login as admin: http://localhost:3000/login');
  console.log('      Email: admin@test.com');
  console.log('      Password: admin123');
  console.log('   3. Visit admin dashboard: http://localhost:3000/admin');
  console.log('   4. Verify all metrics and charts display correctly\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
