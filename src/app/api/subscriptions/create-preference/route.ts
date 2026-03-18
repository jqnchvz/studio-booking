import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { createSubscriptionPreferenceSchema } from '@/lib/validations/subscription';
import { getCurrentUser } from '@/lib/auth/get-user';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { createSubscriptionPreference } from '@/lib/services/mercadopago.service';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/middleware/rate-limit';

/**
 * POST /api/subscriptions/create-preference
 * Create MercadoPago subscription preference for authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 requests per hour
    const rateLimit = checkRateLimit(request, {
      maxAttempts: 5,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Demasiadas solicitudes',
          message: 'Por favor intenta nuevamente más tarde',
          resetTime: rateLimit.resetTime.toISOString(),
        },
        {
          status: 429,
          headers: getRateLimitHeaders(
            rateLimit.remaining,
            rateLimit.resetTime,
            rateLimit.maxAttempts
          ),
        }
      );
    }

    // 1. Authenticate user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: 'Autenticación requerida',
          message: 'Inicia sesión para crear una suscripción',
        },
        { status: 401 }
      );
    }

    // 2. Check if user email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error: 'Correo no verificado',
          message: 'Verifica tu correo electrónico antes de suscribirte',
        },
        { status: 403 }
      );
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const validatedData = createSubscriptionPreferenceSchema.parse(body);

    // 4. Check if user already has an active subscription
    const existingSubscription = await db.subscription.findUnique({
      where: { userId: user.id },
    });

    if (existingSubscription && existingSubscription.status === 'active') {
      return NextResponse.json(
        {
          error: 'Suscripción existente',
          message: 'Ya tienes una suscripción activa',
        },
        { status: 409 }
      );
    }

    // 5. Fetch subscription plan
    const plan = await db.subscriptionPlan.findUnique({
      where: { id: validatedData.planId },
    });

    if (!plan) {
      return NextResponse.json(
        {
          error: 'Plan no encontrado',
          message: 'El plan de suscripción seleccionado no existe',
        },
        { status: 404 }
      );
    }

    if (!plan.isActive) {
      return NextResponse.json(
        {
          error: 'Plan no disponible',
          message: 'El plan de suscripción seleccionado ya no está disponible',
        },
        { status: 400 }
      );
    }

    // 6. Calculate subscription period dates
    const now = new Date();
    const currentPeriodStart = new Date(now);
    const currentPeriodEnd = new Date(now);
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1); // 1 month from now
    const nextBillingDate = new Date(currentPeriodEnd);

    // 7. Create or update subscription record FIRST (before MercadoPago call)
    // This prevents orphaned MercadoPago preferences if database write fails
    let subscription;

    if (existingSubscription) {
      // Update existing subscription with pending status, preferenceId will be set after MP call
      subscription = await db.subscription.update({
        where: { userId: user.id },
        data: {
          planId: plan.id,
          preferenceId: null, // Will be set after MercadoPago call succeeds
          status: 'pending',
          planPrice: plan.price,
          nextBillingDate,
          currentPeriodStart,
          currentPeriodEnd,
          mercadopagoSubId: null, // Will be set by webhook when payment succeeds
          cancelledAt: null,
          gracePeriodEnd: null,
          metadata: Prisma.DbNull,
        },
      });
    } else {
      // Create new subscription with pending status
      subscription = await db.subscription.create({
        data: {
          userId: user.id,
          planId: plan.id,
          preferenceId: null, // Will be set after MercadoPago call succeeds
          status: 'pending',
          planPrice: plan.price,
          nextBillingDate,
          currentPeriodStart,
          currentPeriodEnd,
        },
      });
    }

    // 8. Create MercadoPago preference AFTER database record exists
    const preference = await createSubscriptionPreference(
      plan.id,
      user.id,
      plan.price,
      plan.name,
      user.email
    );

    // 9. Update subscription with MercadoPago preference ID
    subscription = await db.subscription.update({
      where: { id: subscription.id },
      data: {
        preferenceId: preference.preferenceId,
      },
    });

    // 10. Return success response with init_point URL
    return NextResponse.json(
      {
        success: true,
        message: 'Preferencia de suscripción creada exitosamente',
        data: {
          subscriptionId: subscription.id,
          initPoint: preference.init_point,
          preferenceId: preference.preferenceId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validación fallida',
          message: 'Datos de entrada inválidos',
          details: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle MercadoPago errors
    if (error instanceof Error && error.message.includes('MercadoPago')) {
      console.error('MercadoPago error:', error);
      return NextResponse.json(
        {
          error: 'Error en el servicio de pago',
          message: 'No se pudo crear la preferencia de pago. Por favor intenta nuevamente.',
        },
        { status: 503 }
      );
    }

    // Handle unexpected errors
    console.error('Create subscription preference error:', error);
    return NextResponse.json(
      {
        error: 'Error al crear suscripción',
        message: 'Ocurrió un error inesperado. Por favor intenta nuevamente.',
      },
      { status: 500 }
    );
  }
}
