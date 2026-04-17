import { Todo, TodoStatus, Priority } from '@prisma/client';

let idCounter = 1;
function nextId(): string {
  return `cuid-test-${idCounter++}`;
}

export function createTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: nextId(),
    userId: 'user-cuid-123',
    title: 'Test todo',
    description: null,
    status: 'PENDING' as TodoStatus,
    priority: 'MEDIUM' as Priority,
    dueDate: null,
    createdAt: new Date('2025-01-01T10:00:00Z'),
    updatedAt: new Date('2025-01-01T10:00:00Z'),
    ...overrides,
  };
}

export function createTodos(count: number, overrides: Partial<Todo> = {}): Todo[] {
  return Array.from({ length: count }, () => createTodo(overrides));
}
