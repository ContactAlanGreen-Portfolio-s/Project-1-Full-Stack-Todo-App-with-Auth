// src/middleware.ts
// WHY: This runs BEFORE page rendering. Unauthenticated users are
// redirected to /signin instantly, before any React code runs.
// Without this, protected pages would flash before redirecting.

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Token exists here (withAuth already checked)
    // You can add role checks here later
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,  // true = allow, false = redirect to signIn
    },
  }
);

// Which routes to protect — everything except public pages
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/todos/:path*',
    // Add more protected routes here
  ],
};