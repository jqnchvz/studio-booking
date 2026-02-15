import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';

/**
 * GET /api/admin/payments/[id]
 *
 * Get detailed payment information including user, subscription, and optionally webhook events.
 * Requires admin authentication.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Admin guard
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    // 2. Get payment ID from params
    const { id } = await params;

    // 3. Fetch payment with full relations
    const payment = await db.payment.findUnique({
      where: { id },
      select: {
        id: true,
        mercadopagoId: true,
        amount: true,
        penaltyFee: true,
        totalAmount: true,
        status: true,
        dueDate: true,
        paidAt: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        subscription: {
          select: {
            id: true,
            status: true,
            plan: {
              select: {
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });

    // 4. Check if payment exists
    if (!payment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      );
    }

    // 5. Transform to PaymentDetail format
    const paymentDetail = {
      id: payment.id,
      mercadopagoId: payment.mercadopagoId,
      amount: payment.amount,
      penaltyFee: payment.penaltyFee,
      totalAmount: payment.totalAmount,
      status: payment.status,
      dueDate: payment.dueDate.toISOString(),
      paidAt: payment.paidAt?.toISOString() || null,
      metadata: payment.metadata,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
      user: payment.user,
      subscription: payment.subscription,
    };

    // 6. Return payment detail
    return NextResponse.json({ payment: paymentDetail });
  } catch (error) {
    console.error('Error fetching payment detail:', error);
    return NextResponse.json(
      { error: 'Error al cargar detalle del pago' },
      { status: 500 }
    );
  }
}
