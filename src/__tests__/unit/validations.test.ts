import { describe, it, expect } from '@jest/globals';
import { createTodoSchema, updateTodoSchema } from '@/lib/validations';

describe('createTodoSchema', () => {
  // ── Happy path ────────────────────────────────────────────────────────────

  it('accepts a valid todo with all required fields', () => {
    const result = createTodoSchema.safeParse({
      title: 'Buy groceries',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Buy groceries');
      expect(result.data.priority).toBe('MEDIUM');  // default applied
    }
  });

  it('accepts a fully populated todo', () => {
    const result = createTodoSchema.safeParse({
      title: 'Fix the bug',
      description: 'It crashes on null input',
      priority: 'HIGH',
      dueDate: '2025-12-31',
    });
    expect(result.success).toBe(true);
  });

  it('applies default priority MEDIUM when not provided', () => {
    const result = createTodoSchema.safeParse({ title: 'Task' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe('MEDIUM');
    }
  });

  it('trims whitespace from title', () => {
    const result = createTodoSchema.safeParse({ title: '  Buy milk  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Buy milk');  // trimmed
    }
  });

  // ── Validation failures ───────────────────────────────────────────────────

  it('rejects empty title', () => {
    const result = createTodoSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.title).toContain('Title is required');
    }
  });

  it('rejects title exceeding 200 characters', () => {
    const result = createTodoSchema.safeParse({ title: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rejects description exceeding 500 characters', () => {
    const result = createTodoSchema.safeParse({
      title: 'Valid title',
      description: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid priority value', () => {
    const result = createTodoSchema.safeParse({
      title: 'Task',
      priority: 'URGENT',   // not in the enum
    });
    expect(result.success).toBe(false);
  });

  it('rejects malformed date string', () => {
    const result = createTodoSchema.safeParse({
      title: 'Task',
      dueDate: '31-12-2025',   // wrong format — must be YYYY-MM-DD
    });
    expect(result.success).toBe(false);
  });

  it('accepts null dueDate explicitly', () => {
    const result = createTodoSchema.safeParse({ title: 'Task', dueDate: null });
    expect(result.success).toBe(true);
  });

  // ── Priority enum ─────────────────────────────────────────────────────────

  it.each(['LOW', 'MEDIUM', 'HIGH'] as const)(
    'accepts valid priority: %s',
    (priority) => {
      const result = createTodoSchema.safeParse({ title: 'Task', priority });
      expect(result.success).toBe(true);
    }
  );
});

describe('updateTodoSchema', () => {
  it('accepts partial updates — only status', () => {
    const result = updateTodoSchema.safeParse({ status: 'DONE' });
    expect(result.success).toBe(true);
  });

  it('accepts partial updates — only title', () => {
    const result = updateTodoSchema.safeParse({ title: 'New title' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (no-op update)', () => {
    const result = updateTodoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects invalid status value', () => {
    const result = updateTodoSchema.safeParse({ status: 'IN_PROGRESS' });
    expect(result.success).toBe(false);
  });

  it('rejects title over 200 chars in update', () => {
    const result = updateTodoSchema.safeParse({ title: 'x'.repeat(201) });
    expect(result.success).toBe(false);
  });
});
