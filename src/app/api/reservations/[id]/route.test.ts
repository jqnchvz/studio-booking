import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH } from './route';

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    reservation: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/services/reservation.service', () => ({
  checkResourceAvailability: vi.fn(),
}));

import { getCurrentUser } from '@/lib/auth/get-current-user';
import { db } from '@/lib/db';
import { checkResourceAvailability } from '@/lib/services/reservation.service';

const mockGetCurrentUser = vi.mocked(getCurrentUser);
const mockFindUnique = vi.mocked(db.reservation.findUnique);
const mockUpdate = vi.mocked(db.reservation.update);
const mockTransaction = vi.mocked(db.$transaction);
const mockCheckAvailability = vi.mocked(checkResourceAvailability);

// ── Helpers ────────────────────────────────────────────────────────────────────

const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test' };

const mockExisting = {
  id: 'res-1',
  userId: 'user-1',
  resourceId: 'resource-1',
  startTime: new Date('2026-03-20T10:00:00Z'),
  endTime: new Date('2026-03-20T12:00:00Z'),
  status: 'confirmed',
};

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/reservations/res-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const params = Promise.resolve({ id: 'res-1' });

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('PATCH /api/reservations/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);

    const res = await PATCH(makeRequest({ title: 'New Title' }), { params });
    expect(res.status).toBe(401);
  });

  it('returns 404 when reservation not found', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser as any);
    mockFindUnique.mockResolvedValueOnce(null);

    const res = await PATCH(makeRequest({ title: 'New Title' }), { params });
    expect(res.status).toBe(404);
  });

  it('returns 404 when reservation belongs to another user', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser as any);
    mockFindUnique.mockResolvedValueOnce({ ...mockExisting, userId: 'other-user' } as any);

    const res = await PATCH(makeRequest({ title: 'New Title' }), { params });
    expect(res.status).toBe(404);
  });

  it('returns 422 when reservation is cancelled', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser as any);
    mockFindUnique.mockResolvedValueOnce({ ...mockExisting, status: 'cancelled' } as any);

    const res = await PATCH(makeRequest({ title: 'New Title' }), { params });
    expect(res.status).toBe(422);
  });

  it('returns 400 on invalid input', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser as any);
    mockFindUnique.mockResolvedValueOnce(mockExisting as any);

    const res = await PATCH(makeRequest({ attendees: -1 }), { params });
    expect(res.status).toBe(400);
  });

  it('updates title without availability check when times do not change', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser as any);
    mockFindUnique.mockResolvedValueOnce(mockExisting as any);
    mockUpdate.mockResolvedValueOnce({ ...mockExisting, title: 'New Title' } as any);

    const res = await PATCH(makeRequest({ title: 'New Title' }), { params });

    expect(res.status).toBe(200);
    expect(mockCheckAvailability).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('runs availability check inside transaction when startTime changes', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser as any);
    mockFindUnique.mockResolvedValueOnce(mockExisting as any);

    const updatedReservation = {
      ...mockExisting,
      startTime: new Date('2026-03-20T14:00:00Z'),
      endTime: new Date('2026-03-20T16:00:00Z'),
    };

    mockTransaction.mockImplementationOnce(async (cb: any) => {
      mockCheckAvailability.mockResolvedValueOnce({ available: true });
      mockUpdate.mockResolvedValueOnce(updatedReservation as any);
      return cb({
        reservation: { update: mockUpdate },
      });
    });

    const res = await PATCH(
      makeRequest({
        startTime: '2026-03-20T14:00:00Z',
        endTime: '2026-03-20T16:00:00Z',
      }),
      { params }
    );

    expect(res.status).toBe(200);
    expect(mockTransaction).toHaveBeenCalled();
    expect(mockCheckAvailability).toHaveBeenCalledWith(
      mockExisting.resourceId,
      expect.any(Date),
      expect.any(Date),
      expect.anything(), // tx
      'res-1'            // excludeReservationId
    );
  });

  it('returns 409 when new time slot conflicts with another reservation', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser as any);
    mockFindUnique.mockResolvedValueOnce(mockExisting as any);

    mockTransaction.mockImplementationOnce(async (cb: any) => {
      mockCheckAvailability.mockResolvedValueOnce({
        available: false,
        reason: 'El recurso ya está reservado para este horario',
      });
      return cb({
        reservation: { update: mockUpdate },
      });
    });

    const res = await PATCH(
      makeRequest({
        startTime: '2026-03-20T14:00:00Z',
        endTime: '2026-03-20T16:00:00Z',
      }),
      { params }
    );

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('El horario seleccionado no está disponible');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns 409 when new time slot is outside resource availability hours', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser as any);
    mockFindUnique.mockResolvedValueOnce(mockExisting as any);

    mockTransaction.mockImplementationOnce(async (cb: any) => {
      mockCheckAvailability.mockResolvedValueOnce({
        available: false,
        reason: 'El recurso solo está disponible entre 09:00 y 18:00',
      });
      return cb({
        reservation: { update: mockUpdate },
      });
    });

    const res = await PATCH(
      makeRequest({
        startTime: '2026-03-20T20:00:00Z',
        endTime: '2026-03-20T22:00:00Z',
      }),
      { params }
    );

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('El horario seleccionado no está disponible');
  });
});
