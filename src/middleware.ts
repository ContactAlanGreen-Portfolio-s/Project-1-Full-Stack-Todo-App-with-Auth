// src/middleware.ts
// ─────────────────────────────────────────────────────────────────────────────
// Next.js Edge Middleware — runs BEFORE any page or API route is rendered.
//
// WHY MIDDLEWARE FOR AUTH?
// Without this, a user visiting /dashboard would:
//   1. Download and execute JavaScript
//   2. Render the page skeleton
//   3. Detect they're not logged in
//   4. THEN redirect to /signin
// This causes a visible "flash" of the protected page. Middleware prevents
// that entirely — the redirect happens at the network layer before any HTML
// is sent to the browser.
//
// HOW withAuth WORKS:
// next-auth's `withAuth` higher-order function wraps our middleware function.
// It checks for the `next-auth.session-token` cookie (or JWT) automatically.
// If the `authorized` callback returns false, the user is redirected to
// the `signIn` page configured in authOptions (our /signin route).

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  // This inner function only runs when `authorized` returns true.
  // It's where you'd add role-based access control (RBAC) in the future.
  // For now, we just pass the request through.
  function middleware(req) {
    // At this point we know the user has a valid session token.
    // We could check req.nextauth.token.role here for admin routes etc.
    return NextResponse.next(); // allow the request to continue
  },
  {
    callbacks: {
      // `token` is the decoded JWT session token (or null if not signed in).
      // Returning true allows access; returning false triggers a redirect.
      authorized: ({ token }) => !!token,
      // The double `!` converts the token to a boolean:
      //   token exists → !!token = true  → allow
      //   token is null → !!null  = false → redirect to /signin
    },
  },
);

// ── Route matcher ─────────────────────────────────────────────────────────────
// Tells Next.js which routes this middleware should run on.
// Pages NOT listed here (e.g. /, /signin, /api/auth/**) are public.
export const config = {
  matcher: [
    // Protect all sub-routes under /dashboard (e.g. /dashboard, /dashboard/settings)
    "/dashboard/:path*",
    // Protect all todo API routes so the DB is never accessible without auth
    "/api/todos/:path*",
    // Add more protected routes here as the app grows (e.g. /settings/:path*)
  ],
};
