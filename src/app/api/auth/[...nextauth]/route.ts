// src/app/api/auth/[...nextauth]/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Next.js App Router integration for NextAuth.js.
//
// HOW IT WORKS:
// The `[...nextauth]` catch-all dynamic segment means this file handles
// every sub-path under /api/auth/:
//   • GET  /api/auth/session        → returns the current session as JSON
//   • GET  /api/auth/providers      → lists available OAuth providers
//   • GET  /api/auth/csrf           → returns a CSRF token for forms
//   • GET  /api/auth/signin/github  → initiates the GitHub OAuth flow
//   • GET  /api/auth/callback/github→ GitHub redirects here after login
//   • POST /api/auth/signout        → clears the session cookie
//
// All of these routes are implemented internally by NextAuth — we just
// export the handler for both GET and POST, and NextAuth does the rest.
//
// WHY BOTH GET AND POST?
// Some auth operations (like sign-in / sign-out CSRF-protected forms) use
// POST, while session reads and OAuth redirects use GET.

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth'; // our configuration (provider, adapter, etc.)

// NextAuth() returns a single handler function that knows how to respond
// to all the sub-paths listed above based on the URL and HTTP method.
const handler = NextAuth(authOptions);

// Export the same handler for both HTTP verbs so Next.js routes both to it.
export { handler as GET, handler as POST };