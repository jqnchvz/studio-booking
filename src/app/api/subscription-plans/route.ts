import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/subscription-plans
 * Returns all active subscription plans
 */
export async function GET() {
  try {
    const plans = await db.subscriptionPlan.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        price: 'asc', // Order by price: cheapest first
      },
    });

    return NextResponse.json({
      success: true,
      plans,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch subscription plans',
    }, { status: 500 });
  }
}
