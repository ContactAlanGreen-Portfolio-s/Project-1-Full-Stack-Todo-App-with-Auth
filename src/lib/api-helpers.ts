// src/lib/api-helpers.ts
// ─────────────────────────────────────────────────────────────────────────────
// Shared utilities for all API route handlers.
//
// WHY A SHARED MODULE?
// Without this, every route handler would duplicate the same patterns:
//   • Checking the session and returning 401
//   • Catching errors and returning 500
//   • Formatting JSON responses consistently
// Centralising these avoids drift — if we change the error format, we change
// it once here and every route benefits automatically.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth"; // our NextAuth config

// ── successResponse ────────────────────────────────────────────────────────────
// Creates a JSON response with a 200 (or custom) status code.
// Generic <T> means TypeScript can infer the type of `data` from the call site.
//
// Usage:
//   return successResponse(todo);          → 200 with { id: ..., title: ... }
//   return successResponse(todo, 201);     → 201 Created with the same body
//   return successResponse({ data: todos, count: 3 }); → 200 with the list
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

// ── errorResponse ─────────────────────────────────────────────────────────────
// Creates a JSON error response with the given message and HTTP status code.
// The `message` can be a string ("Unauthorised") or a nested object
// (validation errors from Zod: { title: ["Required"] }).
//
// Usage:
//   return errorResponse("Unauthorised", 401);
//   return errorResponse(result.error.flatten().fieldErrors, 400);
export function errorResponse(message: string | object, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── requireAuth ────────────────────────────────────────────────────────────────
// Reads the current session from the request headers and throws if the user
// is not authenticated. Route handlers should call this at the very top.
//
// HOW IT WORKS:
// getServerSession() reads the session cookie, verifies the JWT signature,
// and returns the decoded session or null. If null, we throw an error with
// a special message string. withErrorHandler (below) catches this and
// converts it to a 401 response automatically.
//
// Usage:
//   const session = await requireAuth();  // throws if not logged in
//   const userId = session.user.id;       // guaranteed to exist
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    // Throw a sentinel error. The message string is checked by withErrorHandler.
    throw new Error("UNAUTHORISED");
  }
  return session; // TypeScript now knows session.user.id is defined
}

// ── withErrorHandler ───────────────────────────────────────────────────────────
// A higher-order function that wraps a route handler with try/catch.
// This eliminates the need for try/catch boilerplate in every route.
//
// HOW IT WORKS:
// It returns a new async function with the same signature as the handler.
// If the handler throws, it catches the error and returns the appropriate
// HTTP response based on the error message or attached status code.
//
// Usage:
//   export const GET = withErrorHandler(async (req, context) => {
//     const session = await requireAuth(); // can throw
//     // ... rest of handler
//   });
export function withErrorHandler(
  // The handler is any async function that takes a NextRequest and optional
  // context (route params) and returns a Promise<Response>.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (req: NextRequest, context?: any) => Promise<Response>,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: NextRequest, context?: any) => {
    try {
      // Run the actual route handler
      return await handler(req, context);
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Convert "UNAUTHORISED" sentinel → 401 Unauthorized
        if (error.message === "UNAUTHORISED") {
          return errorResponse("Unauthorised", 401);
        }

        // Convert 404 errors (from getTodoOrFail) → 404 Not Found
        // We use `"status" in error` to safely check without `any` casting
        if ("status" in error && (error as { status: number }).status === 404) {
          return errorResponse("Not Found", 404);
        }

        // Log unexpected errors for debugging, but don't expose internals to the client
        console.error(`[API Error] ${error.message}`);
      }
      // Everything else → 500 Internal Server Error
      return errorResponse("Internal server error", 500);
    }
  };
}
