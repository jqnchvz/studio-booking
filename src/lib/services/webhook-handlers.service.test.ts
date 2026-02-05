import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  handlePaymentUpdated,
  isEventProcessed,
  storeWebhookEvent,
  markEventAsProcessed,
  handlePaymentCreated,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleWebhookEvent,
} from './webhook-handlers.service';

// Mock the database
const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockWebhookFindUnique = vi.fn();
const mockWebhookCreate = vi.fn();
const mockWebhookUpdate = vi.fn();

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
    webhookEvent: {
      findUnique: (...args: unknown[]) => mockWebhookFindUnique(...args),
      create: (...args: unknown[]) => mockWebhookCreate(...args),
      update: (...args: unknown[]) => mockWebhookUpdate(...args),
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

describe('isEventProcessed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true if event is already processed', async () => {
    mockWebhookFindUnique.mockResolvedValueOnce({
      eventId: 'evt-1',
      processed: true,
    });

    const result = await isEventProcessed('evt-1');

    expect(result).toBe(true);
    expect(mockWebhookFindUnique).toHaveBeenCalledWith({
      where: { eventId: 'evt-1' },
    });
  });

  it('should return false if event does not exist', async () => {
    mockWebhookFindUnique.mockResolvedValueOnce(null);

    const result = await isEventProcessed('evt-unknown');

    expect(result).toBe(false);
  });

  it('should return false if event exists but is not processed', async () => {
    mockWebhookFindUnique.mockResolvedValueOnce({
      eventId: 'evt-1',
      processed: false,
    });

    const result = await isEventProcessed('evt-1');

    expect(result).toBe(false);
  });
});

describe('storeWebhookEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a webhook event record', async () => {
    const mockRecord = { id: 'wh-1', eventId: 'evt-1', processed: false };
    mockWebhookCreate.mockResolvedValueOnce(mockRecord);

    const result = await storeWebhookEvent('evt-1', 'payment.updated', {
      data: { id: '123' },
    });

    expect(result).toEqual(mockRecord);
    expect(mockWebhookCreate).toHaveBeenCalledWith({
      data: {
        eventId: 'evt-1',
        eventType: 'payment.updated',
        data: { data: { id: '123' } },
        processed: false,
      },
    });
  });
});

describe('markEventAsProcessed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update the event as processed', async () => {
    mockWebhookUpdate.mockResolvedValueOnce({});

    await markEventAsProcessed('evt-1');

    expect(mockWebhookUpdate).toHaveBeenCalledWith({
      where: { eventId: 'evt-1' },
      data: { processed: true },
    });
  });
});

describe('handlePaymentCreated', () => {
  it('should log payment creation (placeholder)', async () => {
    await expect(handlePaymentCreated('pay-123')).resolves.toBeUndefined();
  });
});

describe('handleSubscriptionCreated', () => {
  it('should log subscription creation (placeholder)', async () => {
    await expect(
      handleSubscriptionCreated('sub-123')
    ).resolves.toBeUndefined();
  });
});

describe('handleSubscriptionUpdated', () => {
  it('should log subscription update (placeholder)', async () => {
    await expect(
      handleSubscriptionUpdated('sub-123')
    ).resolves.toBeUndefined();
  });
});

describe('handleWebhookEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should skip already processed events', async () => {
    mockWebhookFindUnique.mockResolvedValueOnce({
      eventId: '100',
      processed: true,
    });

    await handleWebhookEvent({
      id: 100,
      action: 'updated',
      api_version: 'v1',
      data: { id: '12345' },
      date_created: '2026-02-04T12:00:00Z',
      live_mode: false,
      type: 'payment',
      user_id: 'mp-user-1',
    });

    // Should not store or process
    expect(mockWebhookCreate).not.toHaveBeenCalled();
  });

  it('should process and mark a new event', async () => {
    // Not processed yet
    mockWebhookFindUnique.mockResolvedValueOnce(null);
    mockWebhookCreate.mockResolvedValueOnce({ id: 'wh-1' });
    mockWebhookUpdate.mockResolvedValueOnce({});

    await handleWebhookEvent({
      id: 200,
      action: 'created',
      api_version: 'v1',
      data: { id: '99999' },
      date_created: '2026-02-04T12:00:00Z',
      live_mode: false,
      type: 'payment',
      user_id: 'mp-user-1',
    });

    // Should store the event
    expect(mockWebhookCreate).toHaveBeenCalled();
    // Should mark as processed
    expect(mockWebhookUpdate).toHaveBeenCalledWith({
      where: { eventId: '200' },
      data: { processed: true },
    });
  });
});
