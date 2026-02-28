import { describe, it, expect } from 'vitest';
import {
  PreApprovalCreateSchema,
  PreApprovalCancelSchema,
  PreApprovalAmountUpdateSchema,
  PreferenceCreateSchema,
  PreferenceItemSchema,
} from './mercadopago';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validPreApprovalCreate = {
  reason: 'Plan Pro Mensual',
  payer_email: 'user@example.com',
  auto_recurring: {
    frequency: 1,
    frequency_type: 'months' as const,
    transaction_amount: 29900,
    currency_id: 'CLP',
  },
  back_url: 'https://reservapp.cl/subscriptions',
  external_reference: 'user-123-plan-456',
};

const validPreferenceCreate = {
  items: [
    {
      id: 'payment-123',
      title: 'Pago vencido - Plan Pro',
      description: 'Pago de suscripción con recargo por mora',
      quantity: 1,
      unit_price: 35000,
      currency_id: 'CLP',
    },
  ],
  external_reference: 'overdue-payment-123-user-456',
  back_urls: {
    success: 'http://localhost:3000/subscription/callback/success',
    failure: 'http://localhost:3000/subscription/callback/failure',
    pending: 'http://localhost:3000/subscription/callback/pending',
  },
  auto_return: 'approved' as const,
  notification_url: 'http://localhost:3000/api/webhooks/mercadopago',
};

// ---------------------------------------------------------------------------
// PreApprovalCreateSchema
// ---------------------------------------------------------------------------

describe('PreApprovalCreateSchema', () => {
  it('accepts a valid subscription creation payload', () => {
    const result = PreApprovalCreateSchema.safeParse(validPreApprovalCreate);
    expect(result.success).toBe(true);
  });

  it('rejects missing payer_email', () => {
    const { payer_email: _, ...withoutEmail } = validPreApprovalCreate;
    const result = PreApprovalCreateSchema.safeParse(withoutEmail);
    expect(result.success).toBe(false);
  });

  it('rejects invalid payer_email', () => {
    const result = PreApprovalCreateSchema.safeParse({
      ...validPreApprovalCreate,
      payer_email: 'not-an-email',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/email/i);
    }
  });

  it('rejects empty reason', () => {
    const result = PreApprovalCreateSchema.safeParse({
      ...validPreApprovalCreate,
      reason: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty back_url', () => {
    const result = PreApprovalCreateSchema.safeParse({
      ...validPreApprovalCreate,
      back_url: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty external_reference', () => {
    const result = PreApprovalCreateSchema.safeParse({
      ...validPreApprovalCreate,
      external_reference: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero transaction_amount', () => {
    const result = PreApprovalCreateSchema.safeParse({
      ...validPreApprovalCreate,
      auto_recurring: { ...validPreApprovalCreate.auto_recurring, transaction_amount: 0 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative transaction_amount', () => {
    const result = PreApprovalCreateSchema.safeParse({
      ...validPreApprovalCreate,
      auto_recurring: { ...validPreApprovalCreate.auto_recurring, transaction_amount: -100 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid frequency_type', () => {
    const result = PreApprovalCreateSchema.safeParse({
      ...validPreApprovalCreate,
      auto_recurring: { ...validPreApprovalCreate.auto_recurring, frequency_type: 'years' },
    });
    expect(result.success).toBe(false);
  });

  it('accepts frequency_type "days"', () => {
    const result = PreApprovalCreateSchema.safeParse({
      ...validPreApprovalCreate,
      auto_recurring: { ...validPreApprovalCreate.auto_recurring, frequency_type: 'days' },
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// PreApprovalCancelSchema
// ---------------------------------------------------------------------------

describe('PreApprovalCancelSchema', () => {
  it('accepts { status: "cancelled" }', () => {
    const result = PreApprovalCancelSchema.safeParse({ status: 'cancelled' });
    expect(result.success).toBe(true);
  });

  it('rejects any other status value', () => {
    const result = PreApprovalCancelSchema.safeParse({ status: 'paused' });
    expect(result.success).toBe(false);
  });

  it('rejects missing status', () => {
    const result = PreApprovalCancelSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// PreApprovalAmountUpdateSchema
// ---------------------------------------------------------------------------

describe('PreApprovalAmountUpdateSchema', () => {
  it('accepts a valid amount update payload', () => {
    const result = PreApprovalAmountUpdateSchema.safeParse({
      auto_recurring: { transaction_amount: 49900, currency_id: 'CLP' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects zero amount', () => {
    const result = PreApprovalAmountUpdateSchema.safeParse({
      auto_recurring: { transaction_amount: 0, currency_id: 'CLP' },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/positive/i);
    }
  });

  it('rejects negative amount', () => {
    const result = PreApprovalAmountUpdateSchema.safeParse({
      auto_recurring: { transaction_amount: -500, currency_id: 'CLP' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing currency_id', () => {
    const result = PreApprovalAmountUpdateSchema.safeParse({
      auto_recurring: { transaction_amount: 49900 },
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// PreferenceItemSchema
// ---------------------------------------------------------------------------

describe('PreferenceItemSchema', () => {
  const validItem = {
    id: 'item-1',
    title: 'Test Item',
    quantity: 1,
    unit_price: 10000,
    currency_id: 'CLP',
  };

  it('accepts a valid item', () => {
    expect(PreferenceItemSchema.safeParse(validItem).success).toBe(true);
  });

  it('accepts optional description', () => {
    expect(
      PreferenceItemSchema.safeParse({ ...validItem, description: 'Details here' }).success
    ).toBe(true);
  });

  it('rejects non-positive quantity', () => {
    expect(PreferenceItemSchema.safeParse({ ...validItem, quantity: 0 }).success).toBe(false);
  });

  it('rejects non-positive unit_price', () => {
    expect(PreferenceItemSchema.safeParse({ ...validItem, unit_price: 0 }).success).toBe(false);
  });

  it('rejects empty title', () => {
    expect(PreferenceItemSchema.safeParse({ ...validItem, title: '' }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// PreferenceCreateSchema
// ---------------------------------------------------------------------------

describe('PreferenceCreateSchema', () => {
  it('accepts a valid preference payload', () => {
    const result = PreferenceCreateSchema.safeParse(validPreferenceCreate);
    expect(result.success).toBe(true);
  });

  it('rejects empty items array', () => {
    const result = PreferenceCreateSchema.safeParse({
      ...validPreferenceCreate,
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing external_reference', () => {
    const { external_reference: _, ...withoutRef } = validPreferenceCreate;
    const result = PreferenceCreateSchema.safeParse(withoutRef);
    expect(result.success).toBe(false);
  });

  it('rejects missing back_urls.success', () => {
    const result = PreferenceCreateSchema.safeParse({
      ...validPreferenceCreate,
      back_urls: {
        failure: 'http://localhost:3000/failure',
        pending: 'http://localhost:3000/pending',
      },
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional auto_return and notification_url', () => {
    const { auto_return: _, notification_url: __, ...minimal } = validPreferenceCreate;
    const result = PreferenceCreateSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it('rejects invalid auto_return value', () => {
    const result = PreferenceCreateSchema.safeParse({
      ...validPreferenceCreate,
      auto_return: 'never',
    });
    expect(result.success).toBe(false);
  });
});
