// src/lib/validations.ts
// WHY: Zod schemas are the single source of truth for validation.
// Used on the backend (API routes) AND frontend (React Hook Form).
// Never duplicate validation logic.

import { z } from "zod";

export const createTodoSchema = z.object({
  title: z.string().min(1, "Title is required").max(200).trim(),
  description: z.string().max(500).trim().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().default("MEDIUM"),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
    .optional()
    .nullable(),
});

export const updateTodoSchema = createTodoSchema
  .partial()
  .extend({ status: z.enum(["PENDING", "DONE"]).optional() });

export const todoIdSchema = z.object({
  id: z.string().cuid("Invalid todo ID"),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
