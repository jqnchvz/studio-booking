import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkResourceAvailability,
  checkUserReservationLimit,
  createReservation,
} from './reservation.service';
import { db } from '@/lib/db';
import type { CreateReservationInput } from '@/lib/validations/reservation';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    resource: {
      findUnique: vi.fn(),
    },
    reservation: {
      count: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
  },
}));

describe('Reservation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkResourceAvailability', () => {
    const resourceId = 'resource-123';
    const startTime = new Date('2026-02-09T14:00:00-03:00'); // Monday Feb 9, 2026 - 2pm Chile time
    const endTime = new Date('2026-02-09T16:00:00-03:00'); // Monday Feb 9, 2026 - 4pm Chile time

    it('should return false if resource does not exist', async () => {
      vi.mocked(db.resource.findUnique).mockResolvedValueOnce(null);

      const result = await checkResourceAvailability(resourceId, startTime, endTime);

      expect(result.available).toBe(false);
      expect(result.reason).toBe('El recurso no existe');
    });

    it('should return false if resource is not active', async () => {
      vi.mocked(db.resource.findUnique).mockResolvedValueOnce({
        id: resourceId,
        name: 'Test Resource',
        isActive: false,
        capacity: 10,
        availability: [],
        description: null,
        type: 'room',
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await checkResourceAvailability(resourceId, startTime, endTime);

      expect(result.available).toBe(false);
      expect(result.reason).toBe('El recurso no está disponible actualmente');
    });

    it('should return false if day-of-week is not available', async () => {
      // Monday availability but requesting for a day with no availability
      vi.mocked(db.resource.findUnique).mockResolvedValueOnce({
        id: resourceId,
        name: 'Test Resource',
        isActive: true,
        capacity: 10,
        availability: [
          {
            id: 'avail-1',
            resourceId,
            dayOfWeek: 2, // Tuesday only
            startTime: '09:00',
            endTime: '18:00',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        description: null,
        type: 'room',
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await checkResourceAvailability(resourceId, startTime, endTime);

      expect(result.available).toBe(false);
      expect(result.reason).toBe('El recurso no está disponible este día de la semana');
    });

    it('should return false if time is outside available hours', async () => {
      vi.mocked(db.resource.findUnique).mockResolvedValueOnce({
        id: resourceId,
        name: 'Test Resource',
        isActive: true,
        capacity: 10,
        availability: [
          {
            id: 'avail-1',
            resourceId,
            dayOfWeek: 1, // Monday
            startTime: '09:00',
            endTime: '13:00', // Only until 1pm, but we're requesting 2pm-4pm
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        description: null,
        type: 'room',
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await checkResourceAvailability(resourceId, startTime, endTime);

      expect(result.available).toBe(false);
      expect(result.reason).toContain('solo está disponible entre');
    });

    it('should return false if there is an overlapping reservation', async () => {
      vi.mocked(db.resource.findUnique).mockResolvedValueOnce({
        id: resourceId,
        name: 'Test Resource',
        isActive: true,
        capacity: 10,
        availability: [
          {
            id: 'avail-1',
            resourceId,
            dayOfWeek: 1, // Monday
            startTime: '09:00',
            endTime: '18:00',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        description: null,
        type: 'room',
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock overlapping reservation found
      vi.mocked(db.$queryRaw).mockResolvedValueOnce([
        {
          id: 'reservation-1',
          startTime: new Date('2026-02-09T13:00:00-03:00'),
          endTime: new Date('2026-02-09T15:00:00-03:00'),
        },
      ]);

      const result = await checkResourceAvailability(resourceId, startTime, endTime);

      expect(result.available).toBe(false);
      expect(result.reason).toBe('El recurso ya está reservado para este horario');
      expect(result.conflictingReservation).toBeDefined();
    });

    it('should return true if resource is available', async () => {
      vi.mocked(db.resource.findUnique).mockResolvedValueOnce({
        id: resourceId,
        name: 'Test Resource',
        isActive: true,
        capacity: 10,
        availability: [
          {
            id: 'avail-1',
            resourceId,
            dayOfWeek: 1, // Monday
            startTime: '09:00',
            endTime: '18:00',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        description: null,
        type: 'room',
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // No overlapping reservations
      vi.mocked(db.$queryRaw).mockResolvedValueOnce([]);

      const result = await checkResourceAvailability(resourceId, startTime, endTime);

      expect(result.available).toBe(true);
      expect(result.reason).toBeUndefined();
    });
  });

  describe('checkUserReservationLimit', () => {
    const userId = 'user-123';

    it('should return allowed false when limit is exceeded', async () => {
      // User has already made 10 reservations in last 24 hours
      vi.mocked(db.reservation.count).mockResolvedValueOnce(10);

      const result = await checkUserReservationLimit(userId);

      expect(result.allowed).toBe(false);
      expect(result.count).toBe(10);
      expect(result.limit).toBe(10);
    });

    it('should return allowed true when under limit', async () => {
      // User has made 5 reservations in last 24 hours
      vi.mocked(db.reservation.count).mockResolvedValueOnce(5);

      const result = await checkUserReservationLimit(userId);

      expect(result.allowed).toBe(true);
      expect(result.count).toBe(5);
      expect(result.limit).toBe(10);
    });

    it('should return allowed true when at 9 reservations (one below limit)', async () => {
      vi.mocked(db.reservation.count).mockResolvedValueOnce(9);

      const result = await checkUserReservationLimit(userId);

      expect(result.allowed).toBe(true);
      expect(result.count).toBe(9);
      expect(result.limit).toBe(10);
    });

    it('should query reservations created in last 24 hours', async () => {
      vi.mocked(db.reservation.count).mockResolvedValueOnce(3);

      await checkUserReservationLimit(userId);

      expect(db.reservation.count).toHaveBeenCalledWith({
        where: {
          userId,
          createdAt: {
            gte: expect.any(Date),
          },
        },
      });
    });
  });

  describe('createReservation', () => {
    const userId = 'user-123';
    const reservationData: CreateReservationInput = {
      resourceId: 'resource-123',
      title: 'Team Meeting',
      description: 'Weekly sync',
      startTime: new Date('2026-02-09T14:00:00-03:00'), // Monday
      endTime: new Date('2026-02-09T16:00:00-03:00'), // Monday
      attendees: 5,
    };

    it('should create reservation successfully when available', async () => {
      const mockTransaction = {
        resource: {
          findUnique: vi.fn().mockResolvedValueOnce({
            id: reservationData.resourceId,
            name: 'Test Resource',
            isActive: true,
            capacity: 10,
            availability: [
              {
                id: 'avail-1',
                resourceId: reservationData.resourceId,
                dayOfWeek: 1,
                startTime: '09:00',
                endTime: '18:00',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
            description: null,
            type: 'room',
            metadata: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
        $queryRaw: vi.fn().mockResolvedValueOnce([]), // No conflicts
        reservation: {
          create: vi.fn().mockResolvedValueOnce({
            id: 'reservation-123',
            userId,
            resourceId: reservationData.resourceId,
            title: reservationData.title,
            description: reservationData.description,
            startTime: reservationData.startTime,
            endTime: reservationData.endTime,
            attendees: reservationData.attendees,
            status: 'confirmed',
            metadata: { createdFrom: 'api' },
            createdAt: new Date(),
            updatedAt: new Date(),
            resource: {
              id: reservationData.resourceId,
              name: 'Test Resource',
              type: 'room',
            },
            user: {
              id: userId,
              email: 'user@example.com',
              name: 'Test User',
            },
          }),
        },
      };

      vi.mocked(db.$transaction).mockImplementationOnce((callback: any) =>
        callback(mockTransaction)
      );

      const result = await createReservation(reservationData, userId);

      expect(result).toBeDefined();
      expect(result.id).toBe('reservation-123');
      expect(result.status).toBe('confirmed');
      expect(result.resource.name).toBe('Test Resource');
      expect(result.user.email).toBe('user@example.com');
    });

    it('should throw error if availability check fails inside transaction', async () => {
      const mockTransaction = {
        resource: {
          findUnique: vi.fn().mockResolvedValueOnce(null), // Resource not found
        },
        $queryRaw: vi.fn(),
        reservation: {
          create: vi.fn(),
        },
      };

      vi.mocked(db.$transaction).mockImplementationOnce((callback: any) =>
        callback(mockTransaction)
      );

      await expect(createReservation(reservationData, userId)).rejects.toThrow(
        'El recurso no existe'
      );

      // Verify reservation was not created
      expect(mockTransaction.reservation.create).not.toHaveBeenCalled();
    });

    it('should throw error if resource is already booked (race condition test)', async () => {
      const mockTransaction = {
        resource: {
          findUnique: vi.fn().mockResolvedValueOnce({
            id: reservationData.resourceId,
            name: 'Test Resource',
            isActive: true,
            capacity: 10,
            availability: [
              {
                id: 'avail-1',
                resourceId: reservationData.resourceId,
                dayOfWeek: 1,
                startTime: '09:00',
                endTime: '18:00',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
            description: null,
            type: 'room',
            metadata: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
        $queryRaw: vi.fn().mockResolvedValueOnce([
          {
            id: 'existing-reservation',
            startTime: new Date('2026-02-09T13:00:00-03:00'),
            endTime: new Date('2026-02-09T15:00:00-03:00'),
          },
        ]), // Conflict found
        reservation: {
          create: vi.fn(),
        },
      };

      vi.mocked(db.$transaction).mockImplementationOnce((callback: any) =>
        callback(mockTransaction)
      );

      await expect(createReservation(reservationData, userId)).rejects.toThrow(
        'El recurso ya está reservado para este horario'
      );

      // Verify reservation was not created
      expect(mockTransaction.reservation.create).not.toHaveBeenCalled();
    });

    it('should set status to confirmed and metadata to api', async () => {
      const mockReservation = {
        id: 'reservation-123',
        userId,
        resourceId: reservationData.resourceId,
        title: reservationData.title,
        description: reservationData.description,
        startTime: reservationData.startTime,
        endTime: reservationData.endTime,
        attendees: reservationData.attendees,
        status: 'confirmed',
        metadata: { createdFrom: 'api' },
        createdAt: new Date(),
        updatedAt: new Date(),
        resource: {
          id: reservationData.resourceId,
          name: 'Test Resource',
          type: 'room',
        },
        user: {
          id: userId,
          email: 'user@example.com',
          name: 'Test User',
        },
      };

      const mockTransaction = {
        resource: {
          findUnique: vi.fn().mockResolvedValueOnce({
            id: reservationData.resourceId,
            name: 'Test Resource',
            isActive: true,
            capacity: 10,
            availability: [
              {
                id: 'avail-1',
                resourceId: reservationData.resourceId,
                dayOfWeek: 1,
                startTime: '09:00',
                endTime: '18:00',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
            description: null,
            type: 'room',
            metadata: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
        $queryRaw: vi.fn().mockResolvedValueOnce([]),
        reservation: {
          create: vi.fn().mockResolvedValueOnce(mockReservation),
        },
      };

      vi.mocked(db.$transaction).mockImplementationOnce((callback: any) =>
        callback(mockTransaction)
      );

      await createReservation(reservationData, userId);

      expect(mockTransaction.reservation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'confirmed',
          metadata: { createdFrom: 'api' },
        }),
        include: expect.any(Object),
      });
    });
  });
});
