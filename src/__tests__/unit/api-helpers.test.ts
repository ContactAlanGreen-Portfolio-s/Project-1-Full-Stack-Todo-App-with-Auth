import { describe, it, expect, jest } from '@jest/globals';
import { successResponse, errorResponse } from '@/lib/api-helpers';

// NextResponse.json needs to be mocked in Node environment
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      body,
      status: init?.status ?? 200,
      // Simulate .json() method
      json: async () => body,
    }),
  },
}));

describe('successResponse', () => {
  it('returns status 200 by default', () => {
    const res = successResponse({ id: 1 });
    expect(res.status).toBe(200);
  });

  it('returns the data wrapped in body', () => {
    const data = { id: 1, title: 'Test' };
    const res = successResponse(data);
    expect(res.body).toEqual(data);
  });

  it('accepts a custom status code', () => {
    const res = successResponse({ id: 1 }, 201);
    expect(res.status).toBe(201);
  });
});

describe('errorResponse', () => {
  it('returns the given status code', () => {
    const res = errorResponse('Not found', 404);
    expect(res.status).toBe(404);
  });

  it('wraps the message in an error key', () => {
    const res = errorResponse('Unauthorised', 401);
    expect(res.body).toEqual({ error: 'Unauthorised' });
  });
});
