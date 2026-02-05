import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handlePaymentUpdated } from './webhook-handlers.service';

// Mock the database
const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    subscription: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    payment: {
      findUnique: vi.fn().mockResolvedValue(null), // No existing payment by default
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      update: vi.fn(),
    },
  },
}));

// Mock MercadoPago service
const mockFetchPaymentDetails = vi.fn();
vi.mock('./mercadopago.service', () => ({
  fetchPaymentDetails: (...args: unknown[]) => mockFetchPaymentDetails(...args),
}));

// Helper to build a mock subscription
function mockSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub-1',
    userId: 'user-1',
    planId: 'plan-1',
    status: 'active',
    gracePeriodEnd: null,
    user: { email: 'test@example.com' },
    plan: { id: 'plan-1', name: 'Monthly' },
    ...overrides,
  };
}

// Helper to build a mock MercadoPago payment response
function mockMPPayment(
  status: string,
  overrides: Record<string, unknown> = {}
) {
  return {
    id: 12345,
    status,
    external_reference: 'user-1-plan-1',
    transaction_amount: 50000,
    currency_id: 'CLP',
    date_approved: status === 'approved' ? new Date().toISOString() : null,
    ...overrides,
  };
}

// Helper to build mock payment records in the DB
function mockPaymentRecord(
  status: string,
  overrides: Record<string, unknown> = {}
) {
  return {
    id: `pay-${Math.random().toString(36).slice(2, 7)}`,
    userId: 'user-1',
    subscriptionId: 'sub-1',
    mercadopagoId: `mp-${Math.random().toString(36).slice(2, 7)}`,
    amount: 50000,
    penaltyFee: 0,
    totalAmount: 50000,
    status,
    dueDate: new Date(),
    paidAt: status === 'approved' ? new Date() : null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('handlePaymentUpdated - Grace Period Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-04T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('1st consecutive failure', () => {
    it('should set gracePeriodEnd to 3 days from now', async () => {
      mockFetchPaymentDetails.mockResolvedValueOnce(
        mockMPPayment('rejected')
      );
      mockFindUnique.mockResolvedValueOnce(mockSubscription());
      mockCreate.mockResolvedValueOnce({ id: 'pay-new' });
      // 1 rejected payment = 1st consecutive failure
      mockFindMany.mockResolvedValueOnce([mockPaymentRecord('rejected')]);
      mockUpdate.mockResolvedValueOnce({});

      await handlePaymentUpdated('12345');

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: {
          status: 'past_due',
          gracePeriodEnd: new Date('2026-02-07T12:00:00Z'),
        },
      });
    });
  });

  describe('2nd consecutive failure', () => {
    it('should NOT extend the gracePeriodEnd', async () => {
      const existingGraceEnd = new Date('2026-02-07T12:00:00Z');

      mockFetchPaymentDetails.mockResolvedValueOnce(
        mockMPPayment('rejected')
      );
      mockFindUnique.mockResolvedValueOnce(
        mockSubscription({
          status: 'past_due',
          gracePeriodEnd: existingGraceEnd,
        })
      );
      mockCreate.mockResolvedValueOnce({ id: 'pay-new' });
      // 2 rejected payments = 2nd consecutive failure
      mockFindMany.mockResolvedValueOnce([
        mockPaymentRecord('rejected'),
        mockPaymentRecord('rejected'),
      ]);
      mockUpdate.mockResolvedValueOnce({});

      await handlePaymentUpdated('12345');

      // Should update to past_due WITHOUT a new gracePeriodEnd
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: {
          status: 'past_due',
        },
      });

      // Verify gracePeriodEnd was NOT included in the update data
      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('gracePeriodEnd');
    });
  });

  describe('3rd consecutive failure', () => {
    it('should suspend the subscription and clear gracePeriodEnd', async () => {
      mockFetchPaymentDetails.mockResolvedValueOnce(
        mockMPPayment('rejected')
      );
      mockFindUnique.mockResolvedValueOnce(
        mockSubscription({
          status: 'past_due',
          gracePeriodEnd: new Date('2026-02-07T12:00:00Z'),
        })
      );
      mockCreate.mockResolvedValueOnce({ id: 'pay-new' });
      // 3 rejected payments = 3rd consecutive failure
      mockFindMany.mockResolvedValueOnce([
        mockPaymentRecord('rejected'),
        mockPaymentRecord('rejected'),
        mockPaymentRecord('rejected'),
      ]);
      mockUpdate.mockResolvedValueOnce({});

      await handlePaymentUpdated('12345');

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: {
          status: 'suspended',
          gracePeriodEnd: null,
        },
      });
    });
  });

  describe('approved payment', () => {
    it('should clear gracePeriodEnd when payment is approved', async () => {
      mockFetchPaymentDetails.mockResolvedValueOnce(
        mockMPPayment('approved')
      );
      mockFindUnique.mockResolvedValueOnce(
        mockSubscription({
          status: 'past_due',
          gracePeriodEnd: new Date('2026-02-07T12:00:00Z'),
        })
      );
      mockUpdate.mockResolvedValueOnce({});

      await handlePaymentUpdated('12345');

      // The subscription update for approved payments should clear gracePeriodEnd
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub-1' },
          data: expect.objectContaining({
            status: 'active',
            gracePeriodEnd: null,
          }),
        })
      );
    });
  });
});
