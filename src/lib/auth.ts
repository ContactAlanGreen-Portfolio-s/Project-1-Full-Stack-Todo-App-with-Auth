// src/lib/auth.ts
// ─────────────────────────────────────────────────────────────────────────────
// NextAuth.js configuration — the single source of truth for authentication.
//
// WHY NEXT-AUTH?
// NextAuth handles the complex parts of OAuth: redirects, CSRF tokens, token
// rotation, session cookies, and database user creation — all in a few lines.
// We get secure, production-ready auth without writing any of that ourselves.
//
// FLOW OVERVIEW:
// 1. User clicks "Continue with GitHub" on /signin
// 2. NextAuth redirects to GitHub's OAuth page
// 3. GitHub redirects back to /api/auth/callback/github with a code
// 4. NextAuth exchanges the code for an access token, fetches the GitHub profile
// 5. PrismaAdapter automatically creates a User row (or finds existing one)
// 6. NextAuth issues a JWT session token stored in a secure HTTP-only cookie
// 7. Every subsequent request includes that cookie; middleware verifies it

import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GithubProvider from 'next-auth/providers/github';
import { db } from './db';

export const authOptions: NextAuthOptions = {
  // ── Database adapter ────────────────────────────────────────────────────────
  // PrismaAdapter links NextAuth to our PostgreSQL database.
  // It automatically manages User, Account, Session, and VerificationToken tables.
  // When a user signs in for the first time, it creates a new User row.
  // The `as any` cast is needed because @auth/prisma-adapter's types don't
  // perfectly align with next-auth's type definitions yet.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(db) as any,

  // ── OAuth providers ─────────────────────────────────────────────────────────
  // Each provider handles one login method. We use GitHub OAuth.
  // GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are set in .env.local.
  // The `!` asserts they are defined — startup will throw if they're missing.
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],

  // ── Session strategy ─────────────────────────────────────────────────────────
  // 'jwt' stores the session in a signed, encrypted token in the browser cookie.
  // Alternative is 'database' (stores sessions in a DB table) — JWT is simpler
  // and doesn't require a session table query on every request.
  // maxAge: 30 days before the session expires and the user must log in again.
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  },

  // ── Callbacks ────────────────────────────────────────────────────────────────
  // Callbacks run at specific points in the auth flow and let us customise
  // the JWT token and session objects.
  callbacks: {
    // jwt runs when the JWT is first created (sign in) and on every subsequent
    // request that reads the session. We attach `user.id` to the token here
    // so it's available in the session callback below.
    async jwt({ token, user }) {
      // `user` is only defined on the FIRST sign-in — not on refresh
      if (user) {
        token.id = user.id; // copy the DB user id into the JWT payload
      }
      return token; // the token is encoded and stored in the cookie
    },

    // session runs whenever a component or server code calls getServerSession().
    // We copy `token.id` onto session.user so every part of the app can read it
    // as session.user.id without decoding the JWT manually.
    async session({ session, token }) {
      if (token && session.user) {
        // `session.user` doesn't have `id` by default — we add it.
        // The `as any` avoids a TypeScript error since the Session type
        // doesn't declare `id` (you'd normally extend it via module augmentation).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },

  // ── Custom pages ─────────────────────────────────────────────────────────────
  // Override NextAuth's default built-in sign-in page with our custom one.
  // NextAuth will redirect to /signin when auth is required.
  // On error (e.g. OAuth denied), it also goes to /signin.
  pages: {
    signIn: '/signin',
    error: '/signin', // show error on our signin page (query param: ?error=...)
  },
};