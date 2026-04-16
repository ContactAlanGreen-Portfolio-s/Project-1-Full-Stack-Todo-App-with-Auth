// src/lib/validations.ts
// WHY: Zod schemas are the single source of truth for validation.
// Used on the backend (API routes) AND frontend (React Hook Form).
// Never duplicate validation logic.

import { z } from 'zod';
import { Priority } from '@prisma/client';

export const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .trim()
    .optional(),
  priority: z.nativeEnum(Priority).default('MEDIUM'),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
    .optional()
    .nullable(),
});

export const updateTodoSchema = createTodoSchema
  .partial()                         // all fields optional
  .extend({
    status: z.enum(['PENDING', 'DONE']).optional(),
  });

export const todoIdSchema = z.object({
  id: z.string().cuid('Invalid todo ID'),
});

// TypeScript types inferred from schemas
export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;