import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { jest } from '@jest/globals';

// Create a deep mock of the entire Prisma client
// Every method (findMany, create, update, delete) is auto-mocked
export const prismaMock = mockDeep<PrismaClient>();

// This module mock replaces src/lib/db.ts throughout tests
jest.mock('@/lib/db', () => ({
  db: prismaMock,
}));

// Reset all mock implementations between tests
beforeEach(() => {
  mockReset(prismaMock);
});
