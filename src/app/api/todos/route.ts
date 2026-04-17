// src/app/api/todos/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createTodoSchema } from "@/lib/validations";
import {
  requireAuth,
  successResponse,
  errorResponse,
  withErrorHandler,
} from "@/lib/api-helpers";
export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  const session = await requireAuth();

  const todos = await db.todo.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  // Returns { items: [...], count: X }
  return successResponse({ items: todos, count: todos.length });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAuth();
  const body = await req.json();

  const result = createTodoSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(result.error.flatten().fieldErrors, 400);
  }

  const { title, description, priority, dueDate } = result.data;

  const todo = await db.todo.create({
    data: {
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      userId: session.user.id,
    },
  });

  return successResponse(todo, 201);
});
