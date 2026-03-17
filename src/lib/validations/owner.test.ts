import { describe, it, expect } from 'vitest';
import {
  createResourceSchema,
  updateResourceSchema,
  toggleActiveSchema,
  createPlanSchema,
  updatePlanSchema,
} from './owner';

// ─── createResourceSchema ────────────────────────────────────────────────────

describe('createResourceSchema', () => {
  const valid = { name: 'Sala A', type: 'room' as const };

  it('accepts minimal valid input', () => {
    expect(createResourceSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts all optional fields', () => {
    const result = createResourceSchema.safeParse({
      ...valid,
      description: 'desc',
      capacity: 10,
      dropInEnabled: true,
      dropInPricePerHour: 5000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = createResourceSchema.safeParse({ type: 'room' });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = createResourceSchema.safeParse({ name: '  ', type: 'room' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid type', () => {
    const result = createResourceSchema.safeParse({ name: 'X', type: 'studio' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'El tipo debe ser room, court, equipment u other'
      );
    }
  });

  it('rejects negative capacity', () => {
    const result = createResourceSchema.safeParse({ ...valid, capacity: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer capacity', () => {
    const result = createResourceSchema.safeParse({ ...valid, capacity: 1.5 });
    expect(result.success).toBe(false);
  });

  it('trims name whitespace', () => {
    const result = createResourceSchema.safeParse({ name: '  Sala A  ', type: 'room' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe('Sala A');
  });
});

// ─── updateResourceSchema ────────────────────────────────────────────────────

describe('updateResourceSchema', () => {
  const valid = { name: 'Sala A', type: 'room' as const };

  it('rejects dropInEnabled=true without price', () => {
    const result = updateResourceSchema.safeParse({ ...valid, dropInEnabled: true });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'El precio por hora es requerido cuando drop-in está habilitado'
      );
    }
  });

  it('accepts dropInEnabled=true with valid price', () => {
    const result = updateResourceSchema.safeParse({
      ...valid,
      dropInEnabled: true,
      dropInPricePerHour: 3000,
    });
    expect(result.success).toBe(true);
  });

  it('accepts dropInEnabled=false without price', () => {
    const result = updateResourceSchema.safeParse({ ...valid, dropInEnabled: false });
    expect(result.success).toBe(true);
  });
});

// ─── toggleActiveSchema ───────────────────────────────────────────────────────

describe('toggleActiveSchema', () => {
  it('accepts isActive true', () => {
    expect(toggleActiveSchema.safeParse({ isActive: true }).success).toBe(true);
  });

  it('accepts isActive false', () => {
    expect(toggleActiveSchema.safeParse({ isActive: false }).success).toBe(true);
  });

  it('rejects missing isActive', () => {
    expect(toggleActiveSchema.safeParse({}).success).toBe(false);
  });

  it('rejects non-boolean isActive', () => {
    expect(toggleActiveSchema.safeParse({ isActive: 'true' }).success).toBe(false);
  });
});

// ─── createPlanSchema ─────────────────────────────────────────────────────────

describe('createPlanSchema', () => {
  const valid = {
    name: 'Plan Pro',
    description: 'Acceso ilimitado',
    price: 15000,
    interval: 'monthly' as const,
  };

  it('accepts valid input', () => {
    expect(createPlanSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts yearly interval', () => {
    expect(createPlanSchema.safeParse({ ...valid, interval: 'yearly' }).success).toBe(true);
  });

  it('accepts optional features array', () => {
    const result = createPlanSchema.safeParse({ ...valid, features: ['WiFi', 'Estacionamiento'] });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.features).toEqual(['WiFi', 'Estacionamiento']);
  });

  it('rejects missing name', () => {
    const result = createPlanSchema.safeParse({ ...valid, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing description', () => {
    const result = createPlanSchema.safeParse({ ...valid, description: '' });
    expect(result.success).toBe(false);
  });

  it('rejects zero price', () => {
    const result = createPlanSchema.safeParse({ ...valid, price: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El precio debe ser un número positivo');
    }
  });

  it('rejects negative price', () => {
    expect(createPlanSchema.safeParse({ ...valid, price: -100 }).success).toBe(false);
  });

  it('rejects invalid interval', () => {
    const result = createPlanSchema.safeParse({ ...valid, interval: 'weekly' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El intervalo debe ser monthly o yearly');
    }
  });

  it('trims name and description', () => {
    const result = createPlanSchema.safeParse({
      ...valid,
      name: '  Plan Pro  ',
      description: '  desc  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Plan Pro');
      expect(result.data.description).toBe('desc');
    }
  });
});

// ─── updatePlanSchema ─────────────────────────────────────────────────────────

describe('updatePlanSchema', () => {
  it('is identical to createPlanSchema', () => {
    const valid = {
      name: 'Plan Pro',
      description: 'desc',
      price: 10000,
      interval: 'monthly' as const,
    };
    expect(updatePlanSchema.safeParse(valid).success).toBe(true);
    expect(updatePlanSchema.safeParse({ ...valid, price: -1 }).success).toBe(false);
  });
});
