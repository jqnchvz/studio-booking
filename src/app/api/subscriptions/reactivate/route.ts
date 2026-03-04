import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createSubscriptionPreference } from '@/lib/services/mercadopago.service';
import { reactivateSubscriptionSchema } from '@/lib/validations/subscription';

/**
 * POST /api/subscriptions/reactivate
 * Reactivates a cancelled or suspended subscription
 *
 * Security:
 * - Requires valid session token
 * - User can only reactivate their own subscription
 *
 * Process:
 * 1. Verify subscription is cancelled or suspended
 * 2. Optionally accept new planId for plan change during reactivation
 * 3. Create new MercadoPago payment preference
 * 4. Update subscription status to 'pending'
 * 5. Return init_point for checkout
 * 6. On payment success (webhook), subscription will be activated
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Subscription reactivation request received');

    // 1. Get and verify current user
    const user = await getCurrentUser();

    if (!user) {
      console.log('❌ No authenticated user found');
      return NextResponse.json(
        { error: 'No autorizado', message: 'Autenticación requerida' },
        { status: 401 }
      );
    }

    // 2. Verify email is confirmed
    if (!user.emailVerified) {
      console.log('❌ Email not verified for user:', user.id);
      return NextResponse.json(
        {
          error: 'Correo no verificado',
          message: 'Verifica tu correo electrónico antes de reactivar tu suscripción',
        },
        { status: 403 }
      );
    }

    // 3. Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const result = reactivateSubscriptionSchema.safeParse(body);

    if (!result.success) {
      console.log('❌ Invalid request body:', result.error.issues);
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          message: 'Datos de solicitud inválidos',
          details: result.error.issues,
        },
        { status: 400 }
      );
    }

    const { newPlanId } = result.data;

    // 4. Fetch user's subscription
    const subscription = await db.subscription.findUnique({
      where: { userId: user.id },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            isActive: true,
          },
        },
      },
    });

    if (!subscription) {
      console.log('❌ No subscription found for user:', user.id);
      return NextResponse.json(
        {
          error: 'Suscripción no encontrada',
          message: 'No se encontró una suscripción para reactivar',
        },
        { status: 404 }
      );
    }

    // 5. Verify subscription can be reactivated
    // Allow: cancelled, suspended, and pending (for retry scenarios)
    const reactivatableStatuses = ['cancelled', 'suspended', 'pending'];
    if (!reactivatableStatuses.includes(subscription.status)) {
      console.log('❌ Subscription cannot be reactivated:', subscription.status);
      return NextResponse.json(
        {
          error: 'No se puede reactivar',
          message: `No se puede reactivar la suscripción con estado: ${subscription.status}`,
        },
        { status: 400 }
      );
    }

    // 6. Determine which plan to use
    let planToUse = subscription.plan;

    if (newPlanId && newPlanId !== subscription.plan.id) {
      // User wants to reactivate with a different plan
      const newPlan = await db.subscriptionPlan.findUnique({
        where: { id: newPlanId },
        select: {
          id: true,
          name: true,
          price: true,
          isActive: true,
        },
      });

      if (!newPlan) {
        return NextResponse.json(
          { error: 'Plan no encontrado', message: 'El plan seleccionado no existe' },
          { status: 404 }
        );
      }

      if (!newPlan.isActive) {
        return NextResponse.json(
          { error: 'Plan no disponible', message: 'El plan seleccionado ya no está disponible' },
          { status: 400 }
        );
      }

      planToUse = newPlan;
      console.log(`📝 Reactivating with new plan: ${newPlan.name}`);
    } else {
      // Validate current plan is still active
      if (!subscription.plan.isActive) {
        console.log('❌ Current plan is no longer active:', subscription.plan.name);
        return NextResponse.json(
          {
            error: 'Plan no disponible',
            message: 'Tu plan anterior ya no está disponible. Por favor selecciona un nuevo plan.',
          },
          { status: 400 }
        );
      }
      console.log(`📝 Reactivating with current plan: ${planToUse.name}`);
    }

    // 7. Calculate subscription period dates
    const now = new Date();
    const currentPeriodStart = new Date(now);
    const currentPeriodEnd = new Date(now);
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1); // 1 month from now
    const nextBillingDate = new Date(currentPeriodEnd);

    // 8. Create MercadoPago payment preference FIRST
    // This prevents DB corruption if MercadoPago call fails
    console.log('🔄 Creating MercadoPago preference...');
    const preference = await createSubscriptionPreference(
      planToUse.id,
      user.id,
      planToUse.price,
      planToUse.name,
      user.email
    );

    console.log(`✅ MercadoPago preference created: ${preference.preferenceId}`);

    // 9. Only update database after MercadoPago succeeds
    const updatedSubscription = await db.subscription.update({
      where: { id: subscription.id },
      data: {
        planId: planToUse.id,
        preferenceId: preference.preferenceId,
        status: 'pending',
        planPrice: planToUse.price,
        nextBillingDate,
        currentPeriodStart,
        currentPeriodEnd,
        mercadopagoSubId: null, // Will be set by webhook when payment succeeds
        cancelledAt: null, // Clear cancellation date
        gracePeriodEnd: null, // Clear grace period
        metadata: Prisma.DbNull, // Clear any scheduled plan changes
      },
    });

    console.log(`✅ Subscription updated to pending status for reactivation`);
    console.log(`   Plan: ${planToUse.name}`);
    console.log(`   Price: ${planToUse.price} CLP`);

    // TODO: Send reactivation email (future task)

    // 11. Return success response with init_point URL
    return NextResponse.json(
      {
        success: true,
        message: 'Reactivación de suscripción iniciada',
        data: {
          subscriptionId: updatedSubscription.id,
          initPoint: preference.init_point,
          preferenceId: preference.preferenceId,
          plan: {
            id: planToUse.id,
            name: planToUse.name,
            price: planToUse.price,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error reactivating subscription:', error);

    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: 'Ocurrió un error al reactivar la suscripción',
      },
      { status: 500 }
    );
  }
}
