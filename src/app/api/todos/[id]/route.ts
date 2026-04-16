// src/app/api/todos/[id]/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { updateTodoSchema } from "@/lib/validations";
import {
  requireAuth,
  successResponse,
  errorResponse,
  withErrorHandler,
} from "@/lib/api-helpers";

async function getTodoOrFail(id: string, userId: string) {
  const todo = await db.todo.findFirst({
    where: { id, userId },
  });

  if (!todo) {
    throw Object.assign(new Error("NOT_FOUND"), { status: 404 });
  }
  return todo;
}

// In Next.js 15, params is a Promise!
type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = withErrorHandler(
  async (req: NextRequest, { params }: RouteContext) => {
    const session = await requireAuth();
    const { id } = await params; // <-- MUST AWAIT PARAMS

    await getTodoOrFail(id, session.user.id);

    const body = await req.json();
    const result = updateTodoSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Validation failed", 400);
    }

    const updated = await db.todo.update({
      where: { id },
      data: {
        ...result.data,
        dueDate: result.data.dueDate
          ? new Date(result.data.dueDate)
          : undefined,
      },
    });

    return successResponse(updated);
  },
);

export const DELETE = withErrorHandler(
  async (_req: NextRequest, { params }: RouteContext) => {
    const session = await requireAuth();
    const { id } = await params; // <-- MUST AWAIT PARAMS

    await getTodoOrFail(id, session.user.id);

    await db.todo.delete({ where: { id } });

    return new Response(null, { status: 204 });
  },
);
