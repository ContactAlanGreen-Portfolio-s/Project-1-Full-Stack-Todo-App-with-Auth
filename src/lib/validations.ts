// src/lib/validations.ts
// ─────────────────────────────────────────────────────────────────────────────
// Zod validation schemas — the single source of truth for data shape.
//
// WHY ZOD?
// Zod provides runtime type checking with full TypeScript integration.
// You define the shape once and get both:
//   • Runtime validation (on the server, before touching the database)
//   • TypeScript types (inferred automatically via z.infer<>)
//
// WHY ONE FILE FOR BOTH CLIENT AND SERVER?
// The same rules should govern:
//   • Server: API routes validate request bodies before writing to DB
//   • Client: React Hook Form validates the form before submitting
// Using the same schema guarantees they can never drift apart.

import { z } from "zod";

// ── createTodoSchema ─────────────────────────────────────────────────────────
// Validates the body of POST /api/todos requests.
// Also used by TodoForm (via zodResolver) for client-side form validation.
export const createTodoSchema = z.object({
  // title: must have at least 1 character (non-empty), max 200 chars.
  // .trim() strips leading/trailing whitespace before validation.
  // "Title is required" is the error message shown in the UI.
  title: z.string().min(1, "Title is required").max(200).trim(),

  // description: optional free-text field, capped at 500 characters.
  // .trim() removes accidental whitespace.
  description: z.string().max(500).trim().optional(),

  // priority: must be exactly one of these three values.
  // .optional() means it can be absent from the request body.
  // .default("MEDIUM") means if it IS absent, Zod fills it in as "MEDIUM".
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().default("MEDIUM"),

  // dueDate: an ISO date string in YYYY-MM-DD format (e.g. "2025-12-31").
  // The regex enforces the exact format — the API route converts it to a Date.
  // nullable() allows null to be explicitly passed (to clear the due date).
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
    .optional()
    .nullable(),
});

// ── updateTodoSchema ──────────────────────────────────────────────────────────
// Validates the body of PATCH /api/todos/:id requests.
// Built by calling .partial() on createTodoSchema — every field becomes optional.
// Then we extend it with a `status` field that doesn't exist on create
// (new todos are always PENDING, so status is not part of the create form).
export const updateTodoSchema = createTodoSchema
  .partial() // all fields optional — a PATCH can update just one field
  .extend({
    // status can only be toggled between PENDING and DONE
    status: z.enum(["PENDING", "DONE"]).optional(),
  });

// ── todoIdSchema ──────────────────────────────────────────────────────────────
// Used to validate the `id` parameter from dynamic routes like /api/todos/[id].
// CUID is a type of collision-resistant unique identifier used by Prisma.
// Validating it prevents accidental lookups with malformed IDs.
export const todoIdSchema = z.object({
  id: z.string().cuid("Invalid todo ID"), // must be a valid CUID format
});

// ── Inferred TypeScript types ──────────────────────────────────────────────────
// z.infer<> extracts the TypeScript type from the Zod schema automatically.
// This means we never write the type manually — Zod is the single source
// of truth for both runtime validation AND compile-time typing.
export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
