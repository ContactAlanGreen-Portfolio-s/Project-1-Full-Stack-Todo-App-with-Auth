// __mocks__/next-auth.ts
// Lightweight stub for next-auth used in unit + integration tests.
// The real next-auth pulls in @auth/prisma-adapter (ESM-only) which breaks Jest.
// Component tests use MSW to intercept HTTP so they don't need this.
import { jest } from '@jest/globals';

// getServerSession is the primary function we need to control in tests.
// It is replaced with a jest.fn() so each test can call mockResolvedValue().
export const getServerSession = jest.fn();

// Stub NextAuth itself (used in the [...nextauth] route)
const NextAuth = jest.fn(() => ({
  GET: jest.fn(),
  POST: jest.fn(),
}));

export default NextAuth;
