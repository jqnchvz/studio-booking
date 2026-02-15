/**
 * Admin Dashboard Type Definitions
 *
 * This file contains TypeScript interfaces for the admin dashboard
 * stats API and related components.
 */

/**
 * Main statistics response from /api/admin/stats
 */
export interface AdminStats {
  metrics: AdminMetrics;
  revenueByMonth: RevenueData[];
  recentActivity: ActivityEvent[];
}

/**
 * Key business metrics for dashboard overview
 */
export interface AdminMetrics {
  /** Number of currently active subscriptions */
  activeSubscriptions: number;

  /** Monthly Recurring Revenue in Chilean Pesos */
  monthlyRecurringRevenue: number;

  /** Payment success rate as percentage (0-100) for last 30 days */
  paymentSuccessRate: number;

  /** Number of confirmed/pending reservations in next 7 days */
  upcomingReservations: number;

  /** Number of rejected payments in last 30 days */
  failedPayments: number;
}

/**
 * Revenue data grouped by month
 */
export interface RevenueData {
  /** Month label in Spanish (e.g., "Ene 2026", "Feb 2026") */
  month: string;

  /** Total revenue for the month in Chilean Pesos */
  revenue: number;

  /** Number of approved payments in the month */
  payments: number;
}

/**
 * Activity event from various system sources
 */
export interface ActivityEvent {
  /** Unique identifier for the event */
  id: string;

  /** Type of event source */
  type: 'subscription' | 'payment' | 'reservation' | 'user';

  /** Spanish description of the action (e.g., "Nueva suscripción al plan Premium") */
  action: string;

  /** ISO 8601 timestamp of when the event occurred */
  timestamp: string;

  /** Additional event-specific data */
  metadata: {
    /** User name associated with the event */
    userName?: string;

    /** Subscription plan name (for subscription events) */
    planName?: string;

    /** Payment amount in CLP (for payment events) */
    amount?: number;

    /** Resource name (for reservation events) */
    resourceName?: string;
  };
}

/**
 * User list item for admin table display
 */
export interface UserListItem {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  emailVerified: boolean;
  createdAt: string; // ISO 8601
  subscription: {
    status: string;
    planName: string;
    planId: string;
  } | null;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * User list API response
 */
export interface UserListResponse {
  users: UserListItem[];
  pagination: PaginationMeta;
}

/**
 * User detail with full relations
 */
export interface UserDetail {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  emailVerified: boolean;
  createdAt: string;
  subscription: {
    id: string;
    status: string;
    planName: string;
    planPrice: number;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    nextBillingDate: string;
  } | null;
  payments: Array<{
    id: string;
    totalAmount: number;
    status: string;
    paidAt: string | null;
    createdAt: string;
    planName: string;
  }>;
  reservations: Array<{
    id: string;
    title: string;
    resourceName: string;
    startTime: string;
    endTime: string;
    status: string;
    createdAt: string;
  }>;
}

/**
 * Payment list item for admin table display
 */
export interface PaymentListItem {
  id: string;
  mercadopagoId: string;
  amount: number;
  penaltyFee: number;
  totalAmount: number;
  status: string;
  dueDate: string; // ISO 8601
  paidAt: string | null; // ISO 8601
  createdAt: string; // ISO 8601
  user: {
    id: string;
    name: string;
    email: string;
  };
  plan: {
    name: string;
  };
}

/**
 * Payment list API response
 */
export interface PaymentListResponse {
  payments: PaymentListItem[];
  pagination: PaginationMeta;
}

/**
 * Payment detail with full relations
 */
export interface PaymentDetail {
  id: string;
  mercadopagoId: string;
  amount: number;
  penaltyFee: number;
  totalAmount: number;
  status: string;
  dueDate: string; // ISO 8601
  paidAt: string | null; // ISO 8601
  metadata: any;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  user: {
    id: string;
    name: string;
    email: string;
  };
  subscription: {
    id: string;
    status: string;
    plan: {
      name: string;
      price: number;
    };
  };
  webhookEvents?: Array<{
    id: string;
    eventType: string;
    createdAt: string; // ISO 8601
    processed: boolean;
  }>;
}
