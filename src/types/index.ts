// src/types/index.ts
// WHY: By default, next-auth's Session type doesn't include user.id.
// This declaration merges our custom fields into the existing types.

import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}

// Application-level types derived from Prisma
import { Todo, TodoStatus, Priority } from '@prisma/client';

export type { Todo, TodoStatus, Priority };

export type TodoWithoutUserId = Omit<Todo, 'userId'>;

export type { CreateTodoInput, UpdateTodoInput } from '@/lib/validations';