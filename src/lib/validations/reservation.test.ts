import { describe, it, expect } from 'vitest';
import { createReservationSchema } from './reservation';

describe('createReservationSchema', () => {
  const validData = {
    resourceId: 'clx1234567890abcdefghijk',
    title: 'Team Meeting',
    description: 'Weekly team sync',
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
    attendees: 5,
  };

  describe('valid inputs', () => {
    it('should accept valid reservation data', () => {
      const result = createReservationSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.resourceId).toBe(validData.resourceId);
        expect(result.data.title).toBe(validData.title);
        expect(result.data.description).toBe(validData.description);
        expect(result.data.attendees).toBe(validData.attendees);
        expect(result.data.startTime).toBeInstanceOf(Date);
        expect(result.data.endTime).toBeInstanceOf(Date);
      }
    });

    it('should accept data with Date objects instead of strings', () => {
      const dataWithDates = {
        ...validData,
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
      };

      const result = createReservationSchema.safeParse(dataWithDates);

      expect(result.success).toBe(true);
    });

    it('should accept data without description (optional field)', () => {
      const { description, ...dataWithoutDescription } = validData;

      const result = createReservationSchema.safeParse(dataWithoutDescription);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeUndefined();
      }
    });

    it('should use default value of 1 for attendees if not provided', () => {
      const { attendees, ...dataWithoutAttendees } = validData;

      const result = createReservationSchema.safeParse(dataWithoutAttendees);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.attendees).toBe(1);
      }
    });

    it('should trim title and description', () => {
      const dataWithSpaces = {
        ...validData,
        title: '  Team Meeting  ',
        description: '  Weekly team sync  ',
      };

      const result = createReservationSchema.safeParse(dataWithSpaces);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Team Meeting');
        expect(result.data.description).toBe('Weekly team sync');
      }
    });
  });

  describe('resourceId validation', () => {
    it('should reject empty resourceId', () => {
      const data = { ...validData, resourceId: '' };

      const result = createReservationSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('obligatorio');
      }
    });

    it('should reject invalid CUID format', () => {
      const data = { ...validData, resourceId: 'invalid-id' };

      const result = createReservationSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('inválido');
      }
    });
  });

  describe('title validation', () => {
    it('should reject title shorter than 3 characters', () => {
      const data = { ...validData, title: 'AB' };

      const result = createReservationSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('al menos 3');
      }
    });

    it('should reject title longer than 100 characters', () => {
      const data = { ...validData, title: 'A'.repeat(101) };

      const result = createReservationSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('no puede exceder 100');
      }
    });
  });

  describe('description validation', () => {
    it('should reject description longer than 500 characters', () => {
      const data = { ...validData, description: 'A'.repeat(501) };

      const result = createReservationSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('no puede exceder 500');
      }
    });
  });

  describe('attendees validation', () => {
    it('should reject attendees less than 1', () => {
      const data = { ...validData, attendees: 0 };

      const result = createReservationSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('al menos 1');
      }
    });

    it('should reject attendees greater than 100', () => {
      const data = { ...validData, attendees: 101 };

      const result = createReservationSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('máximo de asistentes es 100');
      }
    });

    it('should reject non-integer attendees', () => {
      const data = { ...validData, attendees: 5.5 };

      const result = createReservationSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('entero');
      }
    });
  });

  describe('time validation refinements', () => {
    it('should reject when endTime is before startTime', () => {
      const data = {
        ...validData,
        startTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      };

      const result = createReservationSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('posterior a la hora de inicio');
      }
    });

    it('should reject when startTime is in the past', () => {
      const data = {
        ...validData,
        startTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
      };

      const result = createReservationSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('fecha futura');
      }
    });

    it('should reject when duration is less than 30 minutes', () => {
      const startTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 29 * 60 * 1000); // 29 minutes

      const data = {
        ...validData,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };

      const result = createReservationSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('mínima de una reserva es de 30 minutos');
      }
    });

    it('should accept exactly 30 minutes duration', () => {
      const startTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // exactly 30 minutes

      const data = {
        ...validData,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };

      const result = createReservationSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject when duration is more than 8 hours', () => {
      const startTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 9 * 60 * 60 * 1000); // 9 hours

      const data = {
        ...validData,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };

      const result = createReservationSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('máxima de una reserva es de 8 horas');
      }
    });

    it('should accept exactly 8 hours duration', () => {
      const startTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 8 * 60 * 60 * 1000); // exactly 8 hours

      const data = {
        ...validData,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };

      const result = createReservationSchema.safeParse(data);

      expect(result.success).toBe(true);
    });
  });
});
