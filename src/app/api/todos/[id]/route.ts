// src/app/api/todos/[id]/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Resource routes for a single todo: PATCH (update) and DELETE.
// The `[id]` segment in the filename is a Next.js dynamic route parameter —
// requests to /api/todos/clxyz123 arrive here with id = "clxyz123".
//
// SECURITY DESIGN:
// Every handler verifies BOTH authentication (is the user logged in?) AND
// ownership (does this todo belong to that user?). This prevents IDOR attacks:
// a logged-in user cannot modify another user's todos by guessing their IDs.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { updateTodoSchema } from "@/lib/validations";
import {
  requireAuth,
  successResponse,
  errorResponse,
  withErrorHandler,
} from "@/lib/api-helpers";

// force-dynamic ensures Next.js never caches these responses at the CDN level.
// Every request hits our handler fresh, so data is always current.
export const dynamic = "force-dynamic";

// ── Ownership helper ───────────────────────────────────────────────────────────
// Looks up the todo by BOTH id AND userId in a single DB query.
// If not found (either wrong id or wrong owner), it throws a 404 error.
// The `Object.assign` trick attaches a `status` property to the Error instance
// so that withErrorHandler can read it and return the correct HTTP status.
async function getTodoOrFail(id: string, userId: string) {
  const todo = await db.todo.findFirst({
    // WHERE id = $id AND userId = $userId — ownership check built into the query
    where: { id, userId },
  });

  if (!todo) {
    // Throw an error with status 404 — withErrorHandler will catch this
    // and return a 404 response instead of the default 500.
    throw Object.assign(new Error("NOT_FOUND"), { status: 404 });
  }
  return todo;
}

// ── Next.js 15 note ───────────────────────────────────────────────────────────
// In Next.js 15, route parameters are now a Promise (breaking change from 14).
// We MUST await params before accessing its properties.
type RouteContext = { params: Promise<{ id: string }> };

// ── PATCH /api/todos/:id ───────────────────────────────────────────────────────
// Partially updates a todo. Accepts any subset of fields defined in
// updateTodoSchema (title, description, priority, dueDate, status).
export const PATCH = withErrorHandler(
  async (req: NextRequest, { params }: RouteContext) => {
    // 1. Verify the user is authenticated — throws "UNAUTHORISED" if not
    const session = await requireAuth();

    // 2. Extract the dynamic route parameter (MUST be awaited in Next.js 15)
    const { id } = await params;

    // 3. Verify the todo exists AND belongs to the current user
    //    Throws 404 if not found or wrong owner
    await getTodoOrFail(id, session.user.id);

    // 4. Parse and validate the request body against our Zod schema
    //    updateTodoSchema is createTodoSchema.partial() — all fields optional
    const body = await req.json();
    const result = updateTodoSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Validation failed", 400);
    }

    // 5. Apply the update — convert dueDate string to a Date object if present.
    //    `undefined` means "don't change this field" in Prisma's update API.
    const updated = await db.todo.update({
      where: { id },
      data: {
        ...result.data,
        dueDate: result.data.dueDate
          ? new Date(result.data.dueDate) // "2025-12-31" → Date object
          : undefined,                    // omit if not provided
      },
    });

    // 6. Return the updated todo as JSON with 200 OK
    return successResponse(updated);
  },
);

// ── DELETE /api/todos/:id ─────────────────────────────────────────────────────
// Permanently removes a todo. Returns 204 No Content on success.
export const DELETE = withErrorHandler(
  async (_req: NextRequest, { params }: RouteContext) => {
    // Authenticate and verify ownership (same pattern as PATCH)
    const session = await requireAuth();
    const { id } = await params;

    await getTodoOrFail(id, session.user.id);

    // Hard delete — no soft-delete / recycle bin in this app
    await db.todo.delete({ where: { id } });

    // 204 No Content: operation succeeded, nothing to return.
    // The useDeleteTodo hook handles this with `if (res.status === 204) return null`.
    return new Response(null, { status: 204 });
  },
);
