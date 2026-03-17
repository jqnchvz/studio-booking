import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

vi.mock('@/lib/db', () => ({
  db: {
    emailLog: { deleteMany: vi.fn() },
    webhookEvent: { deleteMany: vi.fn() },
    reservation: { deleteMany: vi.fn() },
  },
}));

import { db } from '@/lib/db';

const CRON_SECRET = 'test-cron-secret';

function createRequest(token?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (token) {
    headers['authorization'] = `Bearer ${token}`;
  }
  return new NextRequest('http://localhost:3000/api/cron/cleanup', {
    method: 'POST',
    headers,
  });
}

describe('POST /api/cron/cleanup', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.CRON_SECRET = CRON_SECRET;
  });

  it('returns 401 when no authorization header is provided', async () => {
    const response = await POST(createRequest());
    expect(response.status).toBe(401);
  });

  it('returns 401 when authorization token is invalid', async () => {
    const response = await POST(createRequest('wrong-secret'));
    expect(response.status).toBe(401);
  });

  it('returns 401 when CRON_SECRET is not configured', async () => {
    delete process.env.CRON_SECRET;
    const response = await POST(createRequest(CRON_SECRET));
    expect(response.status).toBe(401);
  });

  it('deletes old records and returns counts on success', async () => {
    vi.mocked(db.emailLog.deleteMany).mockResolvedValueOnce({ count: 5 });
    vi.mocked(db.webhookEvent.deleteMany).mockResolvedValueOnce({ count: 3 });
    vi.mocked(db.reservation.deleteMany).mockResolvedValueOnce({ count: 2 });

    const response = await POST(createRequest(CRON_SECRET));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      emailLogs: 5,
      webhookEvents: 3,
      staleDropins: 2,
    });
  });

  it('passes correct filters to deleteMany calls', async () => {
    vi.mocked(db.emailLog.deleteMany).mockResolvedValueOnce({ count: 0 });
    vi.mocked(db.webhookEvent.deleteMany).mockResolvedValueOnce({ count: 0 });
    vi.mocked(db.reservation.deleteMany).mockResolvedValueOnce({ count: 0 });

    await POST(createRequest(CRON_SECRET));

    expect(db.emailLog.deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: expect.any(Date) } },
    });
    expect(db.webhookEvent.deleteMany).toHaveBeenCalledWith({
      where: { processed: true, createdAt: { lt: expect.any(Date) } },
    });
    expect(db.reservation.deleteMany).toHaveBeenCalledWith({
      where: {
        type: 'dropin',
        status: 'pending',
        createdAt: { lt: expect.any(Date) },
      },
    });
  });
});
