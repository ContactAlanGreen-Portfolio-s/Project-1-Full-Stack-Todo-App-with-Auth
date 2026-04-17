// __mocks__/prisma-adapter.ts
// Stubs out @auth/prisma-adapter which ships only ESM exports.
// In tests we never actually connect to the database, so this is safe.
export function PrismaAdapter(_prisma: unknown) {
  return {};
}
