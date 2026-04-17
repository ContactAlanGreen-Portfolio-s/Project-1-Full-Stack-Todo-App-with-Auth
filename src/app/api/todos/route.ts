// src/app/api/todos/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Collection route for todos: GET (list) and POST (create).
// Handles /api/todos with no additional path segment.
//
// Each handler:
//   1. Verifies the user is authenticated (requireAuth)
//   2. Validates any input data (Zod schema)
//   3. Performs the database operation (Prisma)
//   4. Returns a structured JSON response

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createTodoSchema } from "@/lib/validations";
import {
  requireAuth,
  successResponse,
  errorResponse,
  withErrorHandler,
} from "@/lib/api-helpers";

// Opt out of Next.js static caching — every request hits the handler live.
export const dynamic = "force-dynamic";

// ── GET /api/todos ────────────────────────────────────────────────────────────
// Returns all todos for the authenticated user, newest first.
// Response shape: { data: Todo[], count: number }
export const GET = withErrorHandler(async () => {
  // requireAuth() reads the session from the incoming request headers.
  // If the user is not logged in, it throws "UNAUTHORISED" which
  // withErrorHandler converts to a 401 response.
  const session = await requireAuth();

  // Fetch ONLY this user's todos — the WHERE clause is the security boundary.
  // Never return all todos from all users.
  const todos = await db.todo.findMany({
    where: { userId: session.user.id }, // scoped to the authenticated user
    orderBy: { createdAt: "desc" },     // newest todo appears first in the list
  });

  // Return both the array and the count so the UI can display "All (5)" tabs
  return successResponse({ data: todos, count: todos.length });
});

// ── POST /api/todos ───────────────────────────────────────────────────────────
// Creates a new todo for the authenticated user.
// Accepts: { title, description?, priority?, dueDate? }
// Returns the created todo with a 201 Created status.
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAuth();

  // Parse the raw JSON body from the request
  const body = await req.json();

  // Validate against our Zod schema. safeParse() never throws —
  // instead it returns { success: true, data } or { success: false, error }.
  const result = createTodoSchema.safeParse(body);
  if (!result.success) {
    // Return the field-level validation errors (e.g. { title: ["Title is required"] })
    // with a 400 status so the client knows exactly what went wrong.
    return errorResponse(result.error.flatten().fieldErrors, 400);
  }

  // Destructure the validated (and type-safe) data
  const { title, description, priority, dueDate } = result.data;

  const todo = await db.todo.create({
    data: {
      title,
      description,
      priority,                                        // defaults to "MEDIUM" via Zod schema
      dueDate: dueDate ? new Date(dueDate) : null,     // convert ISO string → Date object
      userId: session.user.id,                         // ALWAYS from session — never from body
      // WHY: if we used body.userId, an attacker could create todos for other users.
    },
  });

  // 201 Created — includes the new todo with its real database ID
  return successResponse(todo, 201);
});
