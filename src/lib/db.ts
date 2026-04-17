// src/lib/db.ts
// ─────────────────────────────────────────────────────────────────────────────
// Prisma database client — the single shared connection to PostgreSQL.
//
// WHY A SINGLETON?
// Next.js hot-reloads the server in development. Without the singleton pattern,
// every hot-reload would create a new PrismaClient, eventually exhausting the
// database connection pool and crashing the app.
//
// HOW IT WORKS:
// On the first request, db is undefined → we create a new PrismaClient.
// We then store it on globalThis (which survives hot-reloads in dev).
// On subsequent requests / reloads, db is already there → we reuse it.
// In production, process restarts are real, so we skip storing on globalThis.

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Extend globalThis with a typed field so TypeScript doesn't complain
// when we attach our PrismaClient instance to the global object.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ── Driver setup (Prisma 7 requires an explicit driver adapter) ───────────────
// Prisma 7 dropped the built-in connection manager in favour of driver adapters.
// We use the official `pg` adapter: create a connection pool, wrap it in
// PrismaPg, and pass it into PrismaClient below.
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString }); // pg manages the connection pool
const adapter = new PrismaPg(pool);         // wraps pg pool in Prisma's API

// ── Client creation (singleton pattern) ──────────────────────────────────────
// The `??` (nullish coalescing) operator:
//   • If globalForPrisma.prisma is set (dev hot-reload), reuse it.
//   • If it's undefined (first boot or production), create a new client.
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter, // pass the pg driver adapter instead of a datasources URL
    // In development, log every SQL query to the console + errors.
    // In production, only log errors to avoid noise.
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  });

// ── Store singleton in globalThis (development only) ─────────────────────────
// We only do this outside production. In production each process has one
// PrismaClient lifecycle, so there is nothing to preserve across reloads.
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;