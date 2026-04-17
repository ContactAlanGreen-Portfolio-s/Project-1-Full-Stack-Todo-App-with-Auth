// helpers/mock-auth.ts
// ─────────────────────────────────────────────────────────────────────────────
// Provides typed helpers that allow individual tests to control what
// getServerSession() returns without touching real OAuth or the database.
//
// HOW IT WORKS:
// jest.config.ts maps `next-auth` → our __mocks__/next-auth.ts stub, so every
// `import { getServerSession } from 'next-auth'` already resolves to a jest.fn().
// We just import it here and export convenience wrappers around it.

import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth'; // resolves to the stub via moduleNameMapper

// Cast to a mocked function so TypeScript knows about .mockResolvedValue() etc.
export const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;

// ── Session factory ───────────────────────────────────────────────────────────
// Creates a realistic Session object with sensible defaults. Pass overrides
// to customise the user (e.g. a different id for ownership tests).
export function createMockSession(overrides?: Partial<Session['user']>): Session {
  return {
    user: {
      id: 'user-cuid-123',
      name: 'Test User',
      email: 'test@example.com',
      image: null,
      ...overrides,
    },
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

// ── Convenience helpers ───────────────────────────────────────────────────────
// Call these at the top of a describe block or in beforeEach to put
// getServerSession into the desired state for that test.

/** Makes getServerSession() return a valid session (user is logged in). */
export function mockAuthenticated(userOverrides?: Partial<Session['user']>) {
  mockGetServerSession.mockResolvedValue(createMockSession(userOverrides));
}

/** Makes getServerSession() return null (user is NOT logged in). */
export function mockUnauthenticated() {
  mockGetServerSession.mockResolvedValue(null);
}
