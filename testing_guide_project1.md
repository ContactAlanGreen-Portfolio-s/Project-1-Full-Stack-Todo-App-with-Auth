# Testing Guide — Project 1: Full Stack Todo App
## Unit · Integration · Component · End-to-End

> **Philosophy:** Tests are not a checkbox — they are a safety net that lets you
> refactor and ship with confidence. For this project you will learn the four
> layers of the testing pyramid and write real, professional tests for each one.

---

## Table of Contents

1. [The Testing Pyramid](#1-the-testing-pyramid)
2. [Package Installation](#2-package-installation)
3. [Configuration Files](#3-configuration-files)
4. [Unit Tests — Schemas & Utilities](#4-unit-tests--schemas--utilities)
5. [Integration Tests — API Route Handlers](#5-integration-tests--api-route-handlers)
6. [Component Tests — React with Testing Library](#6-component-tests--react-with-testing-library)
7. [End-to-End Tests — Playwright](#7-end-to-end-tests--playwright)
8. [Test Utilities & Factories](#8-test-utilities--factories)
9. [CI Integration](#9-ci-integration)
10. [GitHub Issue for Testing Sprint](#10-github-issue-for-testing-sprint)
11. [What to Say in Interviews](#11-what-to-say-in-interviews)

---

## 1. The Testing Pyramid

```
                        ┌───────────────┐
                        │   E2E Tests   │  ← Playwright
                        │   (slow, few) │    Full browser, real flows
                        └───────┬───────┘    ~5–10 tests
                    ┌───────────┴──────────┐
                    │  Component / Integration │  ← Testing Library + MSW
                    │    Tests (medium)        │    Render + simulate user
                    └───────────┬──────────────┘    ~20–40 tests
              ┌─────────────────┴────────────────────┐
              │           Unit Tests (fast, many)     │  ← Jest
              │  Pure functions, schemas, utilities    │    ~30–60 tests
              └──────────────────────────────────────┘

Rule of thumb for this project:
  Unit tests      → schemas, api-helpers, utility functions
  Integration     → API route handlers (mock Prisma + mock NextAuth)
  Component       → TodoForm, TodoItem, TodoList (mock API with MSW)
  E2E             → sign in → create todo → complete → delete → sign out
```

---

## 2. Package Installation

```bash
# ── UNIT & INTEGRATION: Jest + Testing Library ──────────────────────────────

npm install --save-dev \
  jest \
  jest-environment-jsdom \
  @jest/globals \
  ts-jest \
  @types/jest \
  @testing-library/react \
  @testing-library/user-event \
  @testing-library/jest-dom \
  jest-mock-extended \
  next-router-mock \
  identity-obj-proxy

# ── API MOCKING: Mock Service Worker ────────────────────────────────────────

npm install --save-dev msw

# ── E2E: Playwright ──────────────────────────────────────────────────────────

npm install --save-dev @playwright/test
npx playwright install          # downloads Chromium, Firefox, WebKit browsers
npx playwright install-deps     # system dependencies (Linux/CI)
```

**What each package does:**

```
jest                    → Test runner. Runs all your test files.
jest-environment-jsdom  → Simulates a browser DOM in Node (for component tests).
ts-jest                 → Lets Jest understand TypeScript files.
@jest/globals           → Types for describe(), it(), expect() etc.
@types/jest             → TypeScript types for Jest (if not using @jest/globals).

@testing-library/react  → Renders React components in tests.
@testing-library/user-event → Simulates real user interactions (type, click, tab).
@testing-library/jest-dom   → Extra matchers: toBeInTheDocument(), toHaveValue() etc.

jest-mock-extended      → Creates type-safe mocks of TypeScript interfaces (for Prisma).
next-router-mock        → Mocks Next.js router in tests (prevents "router not ready" errors).
identity-obj-proxy      → Mocks CSS modules (returns class names as strings).

msw                     → Mock Service Worker. Intercepts real fetch() calls in tests.
                          Your components call fetch() normally — MSW intercepts.
                          Far better than mocking fetch() globally.

@playwright/test        → End-to-end testing. Drives a real browser.
                          Clicks, types, navigates — exactly like a real user.
```

---

## 3. Configuration Files

### 3.1 Jest Configuration

```typescript
// jest.config.ts (root of project)
import type { Config } from 'jest';
import nextJest from 'next/jest';

// This wrapper reads your next.config.ts and .env.test automatically
const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  // Run component tests in jsdom (browser-like), unit tests in node
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/unit/**/*.test.ts'],
      transform: { '^.+\\.tsx?$': ['ts-jest', {}] },
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/integration/**/*.test.ts'],
      transform: { '^.+\\.tsx?$': ['ts-jest', {}] },
    },
    {
      displayName: 'component',
      testEnvironment: 'jsdom',
      testMatch: ['**/__tests__/components/**/*.test.tsx'],
      setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',  // resolve @/ imports
        '\\.css$': 'identity-obj-proxy', // mock CSS modules
      },
    },
  ],

  // Always collect coverage from these files (even untested ones)
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/app/layout.tsx',     // providers wrapper — hard to test meaningfully
    '!src/types/**',
  ],

  // Coverage targets — start here, raise over time
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

export default createJestConfig(config);
```

### 3.2 Jest Setup File

```typescript
// jest.setup.ts (root of project)
import '@testing-library/jest-dom';

// Reset all mocks between tests — prevents state leaking between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Silence Next.js console noise in test output
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});
```

### 3.3 Test Environment Variables

```bash
# .env.test (committed — safe test values, no real secrets)
DATABASE_URL="postgresql://fake:fake@localhost:5432/fakedb"
DIRECT_URL="postgresql://fake:fake@localhost:5432/fakedb"
NEXTAUTH_SECRET="test-secret-at-least-32-chars-long-fake"
NEXTAUTH_URL="http://localhost:3000"
GITHUB_CLIENT_ID="fake-github-client-id"
GITHUB_CLIENT_SECRET="fake-github-client-secret"
```

### 3.4 Playwright Configuration

```typescript
// playwright.config.ts (root of project)
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,  // fail if test.only() left in CI
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',     // record trace on failed tests
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Only test Chromium for this project (add more for senior projects)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Start the dev server before E2E tests run
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,  // reuse in local dev, always fresh in CI
    timeout: 120 * 1000,
  },
});
```

### 3.5 Update package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",

    "test": "jest",
    "test:unit": "jest --selectProjects unit",
    "test:integration": "jest --selectProjects integration",
    "test:components": "jest --selectProjects component",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:all": "jest --coverage && playwright test"
  }
}
```

### 3.6 Folder Structure for Tests

```
src/
  __tests__/
    unit/
      validations.test.ts        ← Zod schema tests
      api-helpers.test.ts        ← helper function tests
    integration/
      todos.collection.test.ts   ← GET + POST /api/todos
      todos.resource.test.ts     ← PATCH + DELETE /api/todos/:id
    components/
      todo-form.test.tsx         ← TodoForm component
      todo-item.test.tsx         ← TodoItem component
      todo-list.test.tsx         ← TodoList component
    e2e/
      auth.spec.ts               ← sign in / sign out flow
      todos.spec.ts              ← full CRUD flow
    helpers/
      factories.ts               ← test data factories
      msw-handlers.ts            ← MSW request handlers
      mock-prisma.ts             ← mocked Prisma client
```

---

## 4. Unit Tests — Schemas & Utilities

Unit tests are pure: in goes input, out comes output. No database, no HTTP, no DOM.

### 4.1 Testing Zod Validation Schemas

```typescript
// src/__tests__/unit/validations.test.ts
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
```

### 4.2 Testing API Helper Utilities

```typescript
// src/__tests__/unit/api-helpers.test.ts
import { describe, it, expect, jest } from '@jest/globals';
import { successResponse, errorResponse } from '@/lib/api-helpers';

// NextResponse.json needs to be mocked in Node environment
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      body,
      status: init?.status ?? 200,
      // Simulate .json() method
      json: async () => body,
    }),
  },
}));

describe('successResponse', () => {
  it('returns status 200 by default', () => {
    const res = successResponse({ id: 1 });
    expect(res.status).toBe(200);
  });

  it('returns the data wrapped in body', () => {
    const data = { id: 1, title: 'Test' };
    const res = successResponse(data);
    expect(res.body).toEqual({ data });
  });

  it('accepts a custom status code', () => {
    const res = successResponse({ id: 1 }, 201);
    expect(res.status).toBe(201);
  });
});

describe('errorResponse', () => {
  it('returns the given status code', () => {
    const res = errorResponse('Not found', 404);
    expect(res.status).toBe(404);
  });

  it('wraps the message in an error key', () => {
    const res = errorResponse('Unauthorised', 401);
    expect(res.body).toEqual({ error: 'Unauthorised' });
  });
});
```

---

## 5. Integration Tests — API Route Handlers

Integration tests call the actual route handler functions, but mock their
external dependencies (Prisma, NextAuth). This tests real business logic
without needing a database.

### 5.1 Set Up Prisma Mock

```typescript
// src/__tests__/helpers/mock-prisma.ts
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { jest } from '@jest/globals';

// Create a deep mock of the entire Prisma client
// Every method (findMany, create, update, delete) is auto-mocked
export const prismaMock = mockDeep<PrismaClient>();

// This module mock replaces src/lib/db.ts throughout tests
jest.mock('@/lib/db', () => ({
  db: prismaMock,
}));

// Reset all mock implementations between tests
beforeEach(() => {
  mockReset(prismaMock);
});
```

### 5.2 Set Up Auth Mock

```typescript
// src/__tests__/helpers/mock-auth.ts
import { jest } from '@jest/globals';
import type { Session } from 'next-auth';

// A factory for a realistic session object
export function createMockSession(overrides?: Partial<Session['user']>): Session {
  return {
    user: {
      id: 'user-cuid-123',
      name: 'Test User',
      email: 'test@example.com',
      image: null,
      ...overrides,
    },
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

// Mock the getServerSession function from next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

import { getServerSession } from 'next-auth';
export const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;

// Convenience: set up authenticated state
export function mockAuthenticated(userOverrides?: Partial<Session['user']>) {
  mockGetServerSession.mockResolvedValue(createMockSession(userOverrides));
}

// Convenience: set up unauthenticated state
export function mockUnauthenticated() {
  mockGetServerSession.mockResolvedValue(null);
}
```

### 5.3 Test Data Factories

```typescript
// src/__tests__/helpers/factories.ts
// Factories create realistic test data. Never hardcode test data inline.

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
```

### 5.4 Testing GET and POST /api/todos

```typescript
// src/__tests__/integration/todos.collection.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

// Import helpers — order matters: mocks must be set up before importing the route
import '../helpers/mock-prisma';
import { prismaMock } from '../helpers/mock-prisma';
import { mockAuthenticated, mockUnauthenticated } from '../helpers/mock-auth';
import { createTodo, createTodos } from '../helpers/factories';

// Import the route handlers AFTER mocks are set up
import { GET, POST } from '@/app/api/todos/route';

// Helper: create a test NextRequest
function makeRequest(method: string, body?: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/todos', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Helper: parse response body
async function parseResponse(response: Response) {
  const text = await response.text();
  return { status: response.status, body: JSON.parse(text) };
}

// ── GET /api/todos ─────────────────────────────────────────────────────────

describe('GET /api/todos', () => {
  it('returns 401 when not authenticated', async () => {
    mockUnauthenticated();

    const req = makeRequest('GET');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('returns an empty array when user has no todos', async () => {
    mockAuthenticated();
    prismaMock.todo.findMany.mockResolvedValue([]);

    const req = makeRequest('GET');
    const { status, body } = await parseResponse(await GET(req));

    expect(status).toBe(200);
    expect(body.data.data).toEqual([]);
    expect(body.data.count).toBe(0);
  });

  it('returns only the authenticated user\'s todos', async () => {
    const userId = 'user-cuid-123';
    mockAuthenticated({ id: userId });

    const userTodos = createTodos(3, { userId });
    prismaMock.todo.findMany.mockResolvedValue(userTodos);

    const req = makeRequest('GET');
    const { status, body } = await parseResponse(await GET(req));

    expect(status).toBe(200);
    expect(body.data.count).toBe(3);

    // Verify Prisma was called with the correct user filter
    expect(prismaMock.todo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId },
      })
    );
  });

  it('returns todos sorted newest first', async () => {
    mockAuthenticated();
    prismaMock.todo.findMany.mockResolvedValue([]);

    await GET(makeRequest('GET'));

    expect(prismaMock.todo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      })
    );
  });
});

// ── POST /api/todos ────────────────────────────────────────────────────────

describe('POST /api/todos', () => {
  it('returns 401 when not authenticated', async () => {
    mockUnauthenticated();

    const req = makeRequest('POST', { title: 'Test' });
    const res = await POST(req);

    expect(res.status).toBe(401);
    // Verify DB was never touched
    expect(prismaMock.todo.create).not.toHaveBeenCalled();
  });

  it('creates a todo and returns 201 with the new todo', async () => {
    const userId = 'user-cuid-123';
    mockAuthenticated({ id: userId });

    const newTodo = createTodo({ title: 'Buy milk', userId });
    prismaMock.todo.create.mockResolvedValue(newTodo);

    const req = makeRequest('POST', { title: 'Buy milk' });
    const { status, body } = await parseResponse(await POST(req));

    expect(status).toBe(201);
    expect(body.data.title).toBe('Buy milk');
  });

  it('always uses userId from session, never from request body', async () => {
    const realUserId = 'user-cuid-123';
    const attackerUserId = 'attacker-user-id-999';
    mockAuthenticated({ id: realUserId });
    prismaMock.todo.create.mockResolvedValue(createTodo({ userId: realUserId }));

    // Attacker tries to create a todo with someone else's userId in the body
    const req = makeRequest('POST', {
      title: 'Injected',
      userId: attackerUserId,  // ← should be IGNORED
    });
    await POST(req);

    expect(prismaMock.todo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: realUserId,    // ← must be from session, not request body
        }),
      })
    );
  });

  it('returns 400 with validation errors for empty title', async () => {
    mockAuthenticated();

    const req = makeRequest('POST', { title: '' });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(prismaMock.todo.create).not.toHaveBeenCalled();
  });

  it('returns 400 for title exceeding 200 characters', async () => {
    mockAuthenticated();

    const req = makeRequest('POST', { title: 'x'.repeat(201) });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('creates todo with correct default priority when not provided', async () => {
    const userId = 'user-cuid-123';
    mockAuthenticated({ id: userId });
    prismaMock.todo.create.mockResolvedValue(createTodo({ priority: 'MEDIUM' }));

    await POST(makeRequest('POST', { title: 'Task without priority' }));

    expect(prismaMock.todo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ priority: 'MEDIUM' }),
      })
    );
  });

  it('converts dueDate string to a Date object before storing', async () => {
    const userId = 'user-cuid-123';
    mockAuthenticated({ id: userId });
    prismaMock.todo.create.mockResolvedValue(createTodo());

    await POST(makeRequest('POST', { title: 'Task', dueDate: '2025-12-31' }));

    expect(prismaMock.todo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dueDate: new Date('2025-12-31'),  // string → Date object
        }),
      })
    );
  });
});
```

### 5.5 Testing PATCH and DELETE /api/todos/:id

```typescript
// src/__tests__/integration/todos.resource.test.ts
import { describe, it, expect } from '@jest/globals';
import { NextRequest } from 'next/server';
import '../helpers/mock-prisma';
import { prismaMock } from '../helpers/mock-prisma';
import { mockAuthenticated, mockUnauthenticated } from '../helpers/mock-auth';
import { createTodo } from '../helpers/factories';
import { PATCH, DELETE } from '@/app/api/todos/[id]/route';

const PARAMS = { params: { id: 'todo-cuid-abc' } };

function makeRequest(method: string, body?: unknown): NextRequest {
  return new NextRequest(`http://localhost:3000/api/todos/${PARAMS.params.id}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return { status: response.status, body: null };
  return { status: response.status, body: JSON.parse(text) };
}

// ── PATCH /api/todos/:id ───────────────────────────────────────────────────

describe('PATCH /api/todos/:id', () => {
  it('returns 401 when not authenticated', async () => {
    mockUnauthenticated();
    const res = await PATCH(makeRequest('PATCH', { status: 'DONE' }), PARAMS);
    expect(res.status).toBe(401);
  });

  it('returns 404 when todo does not exist', async () => {
    mockAuthenticated();
    prismaMock.todo.findFirst.mockResolvedValue(null);  // not found

    const res = await PATCH(makeRequest('PATCH', { status: 'DONE' }), PARAMS);
    expect(res.status).toBe(404);
    expect(prismaMock.todo.update).not.toHaveBeenCalled();
  });

  it('returns 404 when todo belongs to a different user', async () => {
    // User 'user-A' is logged in
    mockAuthenticated({ id: 'user-A' });

    // findFirst with WHERE userId='user-A' will return null
    // because the todo belongs to 'user-B'
    prismaMock.todo.findFirst.mockResolvedValue(null);

    const res = await PATCH(makeRequest('PATCH', { status: 'DONE' }), PARAMS);

    // SECURITY: must be 404, not 403
    // 403 would reveal the resource exists — 404 is safer
    expect(res.status).toBe(404);
  });

  it('updates a todo successfully and returns 200', async () => {
    mockAuthenticated();
    const existingTodo = createTodo({ id: PARAMS.params.id });
    const updatedTodo = { ...existingTodo, status: 'DONE' as const };

    prismaMock.todo.findFirst.mockResolvedValue(existingTodo);
    prismaMock.todo.update.mockResolvedValue(updatedTodo);

    const { status, body } = await parseResponse(
      await PATCH(makeRequest('PATCH', { status: 'DONE' }), PARAMS)
    );

    expect(status).toBe(200);
    expect(body.data.status).toBe('DONE');
  });

  it('verifies ownership before updating (WHERE userId = session.user.id)', async () => {
    const userId = 'user-cuid-123';
    mockAuthenticated({ id: userId });
    prismaMock.todo.findFirst.mockResolvedValue(createTodo({ id: PARAMS.params.id, userId }));
    prismaMock.todo.update.mockResolvedValue(createTodo());

    await PATCH(makeRequest('PATCH', { status: 'DONE' }), PARAMS);

    // The ownership check must include userId in the where clause
    expect(prismaMock.todo.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: PARAMS.params.id, userId },
      })
    );
  });
});

// ── DELETE /api/todos/:id ──────────────────────────────────────────────────

describe('DELETE /api/todos/:id', () => {
  it('returns 401 when not authenticated', async () => {
    mockUnauthenticated();
    const res = await DELETE(makeRequest('DELETE'), PARAMS);
    expect(res.status).toBe(401);
  });

  it('returns 404 when todo does not exist or belongs to another user', async () => {
    mockAuthenticated();
    prismaMock.todo.findFirst.mockResolvedValue(null);

    const res = await DELETE(makeRequest('DELETE'), PARAMS);
    expect(res.status).toBe(404);
    expect(prismaMock.todo.delete).not.toHaveBeenCalled();
  });

  it('deletes a todo and returns 204 No Content', async () => {
    const userId = 'user-cuid-123';
    mockAuthenticated({ id: userId });
    prismaMock.todo.findFirst.mockResolvedValue(createTodo({ id: PARAMS.params.id, userId }));
    prismaMock.todo.delete.mockResolvedValue(createTodo());

    const res = await DELETE(makeRequest('DELETE'), PARAMS);

    expect(res.status).toBe(204);
    expect(prismaMock.todo.delete).toHaveBeenCalledWith({
      where: { id: PARAMS.params.id },
    });
  });
});
```

---

## 6. Component Tests — React with Testing Library

Component tests render components and simulate real user behaviour.
MSW intercepts fetch() calls — no mocking of hooks needed.

### 6.1 MSW Request Handlers

```typescript
// src/__tests__/helpers/msw-handlers.ts
import { http, HttpResponse } from 'msw';
import { createTodo, createTodos } from './factories';

// These handlers simulate your real API responses
export const handlers = [
  // GET /api/todos — returns 3 test todos
  http.get('/api/todos', () => {
    const todos = createTodos(3);
    return HttpResponse.json({ data: { data: todos, count: todos.length } });
  }),

  // POST /api/todos — creates and returns a new todo
  http.post('/api/todos', async ({ request }) => {
    const body = await request.json() as { title: string };
    const todo = createTodo({ title: body.title });
    return HttpResponse.json({ data: todo }, { status: 201 });
  }),

  // PATCH /api/todos/:id — returns updated todo
  http.patch('/api/todos/:id', async ({ params, request }) => {
    const body = await request.json() as Record<string, string>;
    const todo = createTodo({ id: params.id as string, ...body });
    return HttpResponse.json({ data: todo });
  }),

  // DELETE /api/todos/:id — 204 No Content
  http.delete('/api/todos/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),
];

// Override handlers for specific test scenarios
export const errorHandlers = {
  getServerError: http.get('/api/todos', () => {
    return HttpResponse.json({ error: 'Internal server error' }, { status: 500 });
  }),

  postValidationError: http.post('/api/todos', () => {
    return HttpResponse.json(
      { error: { title: ['Title is required'] } },
      { status: 400 }
    );
  }),
};
```

### 6.2 MSW Server Setup

```typescript
// src/__tests__/helpers/msw-server.ts
import { setupServer } from 'msw/node';
import { handlers } from './msw-handlers';

// Create the server with default handlers
export const server = setupServer(...handlers);

// Start before all tests in this suite
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset between tests to avoid handler leakage
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
```

### 6.3 Testing the TodoForm Component

```typescript
// src/__tests__/components/todo-form.test.tsx
import { describe, it, expect } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../helpers/msw-server';
import { server } from '../helpers/msw-server';
import { errorHandlers } from '../helpers/msw-handlers';
import { TodoForm } from '@/components/todos/todo-form';

// Wrapper provides the QueryClient context all hooks need
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },   // don't retry in tests — fail fast
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('TodoForm', () => {
  it('renders the title input and submit button', () => {
    renderWithProviders(<TodoForm />);

    expect(screen.getByPlaceholderText('What needs to be done?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
  });

  it('shows a validation error when submitting with empty title', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodoForm />);

    // Click submit without filling in the title
    await user.click(screen.getByRole('button', { name: /add task/i }));

    // Error message should appear inline
    expect(await screen.findByText('Title is required')).toBeInTheDocument();
  });

  it('disables the submit button while the form is submitting', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodoForm />);

    await user.type(screen.getByPlaceholderText('What needs to be done?'), 'New task');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    // Button shows loading text during submission
    expect(screen.getByRole('button', { name: /adding/i })).toBeDisabled();
  });

  it('clears the form after successful submission', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodoForm />);

    const input = screen.getByPlaceholderText('What needs to be done?');
    await user.type(input, 'Test todo');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    // After success, the input should be empty
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('shows an error message when the API returns an error', async () => {
    // Override the default handler for this test only
    server.use(errorHandlers.postValidationError);

    const user = userEvent.setup();
    renderWithProviders(<TodoForm />);

    await user.type(screen.getByPlaceholderText('What needs to be done?'), 'Bad todo');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    // Should not clear the form on error
    await waitFor(() => {
      expect(screen.getByPlaceholderText('What needs to be done?')).toHaveValue('Bad todo');
    });
  });
});
```

### 6.4 Testing the TodoItem Component

```typescript
// src/__tests__/components/todo-item.test.tsx
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../helpers/msw-server';
import { createTodo } from '../helpers/factories';
import { TodoItem } from '@/components/todos/todo-item';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('TodoItem', () => {
  it('renders the todo title', () => {
    const todo = createTodo({ title: 'Write unit tests' });
    renderWithProviders(<TodoItem todo={todo} />);
    expect(screen.getByText('Write unit tests')).toBeInTheDocument();
  });

  it('renders an unchecked checkbox for a PENDING todo', () => {
    const todo = createTodo({ status: 'PENDING' });
    renderWithProviders(<TodoItem todo={todo} />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('renders a checked checkbox for a DONE todo', () => {
    const todo = createTodo({ status: 'DONE' });
    renderWithProviders(<TodoItem todo={todo} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('applies line-through style on a completed todo title', () => {
    const todo = createTodo({ status: 'DONE' });
    renderWithProviders(<TodoItem todo={todo} />);
    const title = screen.getByText(todo.title);
    expect(title).toHaveClass('line-through');
  });

  it('shows the priority badge', () => {
    const todo = createTodo({ priority: 'HIGH' });
    renderWithProviders(<TodoItem todo={todo} />);
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('shows formatted due date when provided', () => {
    const todo = createTodo({ dueDate: new Date('2025-12-25') });
    renderWithProviders(<TodoItem todo={todo} />);
    expect(screen.getByText('Dec 25, 2025')).toBeInTheDocument();
  });

  it('calls PATCH API when checkbox is clicked', async () => {
    const user = userEvent.setup();
    const todo = createTodo({ status: 'PENDING' });
    renderWithProviders(<TodoItem todo={todo} />);

    await user.click(screen.getByRole('checkbox'));

    // After clicking, the checkbox should become checked (DONE)
    await waitFor(() => {
      expect(screen.getByRole('checkbox')).toBeChecked();
    });
  });

  it('shows a confirmation before deleting', async () => {
    const user = userEvent.setup();
    // Mock window.confirm to return false (user cancels)
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    const todo = createTodo();
    renderWithProviders(<TodoItem todo={todo} />);

    await user.click(screen.getByRole('button', { name: /delete task/i }));

    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
```

### 6.5 Testing the TodoList Component

```typescript
// src/__tests__/components/todo-list.test.tsx
import { describe, it, expect } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../helpers/msw-server';
import { server } from '../helpers/msw-server';
import { http, HttpResponse } from 'msw';
import { createTodo, createTodos } from '../helpers/factories';
import { TodoList } from '@/components/todos/todo-list';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('TodoList', () => {
  it('shows skeleton loaders while fetching', () => {
    renderWithProviders(<TodoList />);
    // Skeletons render immediately before data arrives
    // They have data-testid="skeleton" or a specific class
    expect(document.querySelector('[class*="animate-pulse"]')).toBeInTheDocument();
  });

  it('shows todos once loaded', async () => {
    const todos = createTodos(3);
    server.use(
      http.get('/api/todos', () =>
        HttpResponse.json({ data: { data: todos, count: todos.length } })
      )
    );

    renderWithProviders(<TodoList />);

    // Wait for todos to render
    for (const todo of todos) {
      expect(await screen.findByText(todo.title)).toBeInTheDocument();
    }
  });

  it('shows empty state when there are no todos', async () => {
    server.use(
      http.get('/api/todos', () =>
        HttpResponse.json({ data: { data: [], count: 0 } })
      )
    );

    renderWithProviders(<TodoList />);

    expect(await screen.findByText(/no tasks yet/i)).toBeInTheDocument();
  });

  it('shows error banner when the API fails', async () => {
    server.use(
      http.get('/api/todos', () =>
        HttpResponse.json({ error: 'Server error' }, { status: 500 })
      )
    );

    renderWithProviders(<TodoList />);

    expect(await screen.findByText(/failed to load/i)).toBeInTheDocument();
  });

  it('filters to show only pending todos when Pending tab is clicked', async () => {
    const pendingTodo = createTodo({ title: 'Pending task', status: 'PENDING' });
    const doneTodo = createTodo({ title: 'Done task', status: 'DONE' });

    server.use(
      http.get('/api/todos', () =>
        HttpResponse.json({ data: { data: [pendingTodo, doneTodo], count: 2 } })
      )
    );

    const user = userEvent.setup();
    renderWithProviders(<TodoList />);

    await screen.findByText('Pending task');  // wait for load

    // Click the Pending filter tab
    await user.click(screen.getByRole('button', { name: /pending/i }));

    expect(screen.getByText('Pending task')).toBeInTheDocument();
    expect(screen.queryByText('Done task')).not.toBeInTheDocument();
  });

  it('shows correct count in the All tab', async () => {
    const todos = createTodos(5);
    server.use(
      http.get('/api/todos', () =>
        HttpResponse.json({ data: { data: todos, count: 5 } })
      )
    );

    renderWithProviders(<TodoList />);

    // All tab should show "All (5)"
    expect(await screen.findByText(/all \(5\)/i)).toBeInTheDocument();
  });
});
```

---

## 7. End-to-End Tests — Playwright

E2E tests run against your actual running app in a real browser.
They're slow but catch things unit and component tests cannot.

### 7.1 Auth Helper — Bypass Login in Tests

```typescript
// src/__tests__/e2e/helpers/auth.ts
// Logging in via GitHub OAuth in E2E tests is complex (needs real credentials).
// The professional approach: write a test-only API route that sets a session,
// then use that to bypass the OAuth flow in tests.

import { Page } from '@playwright/test';

// Seed the browser with a valid session cookie before the test runs
// This avoids the GitHub OAuth redirect flow entirely
export async function loginAsTestUser(page: Page) {
  // Hit a test-only API route that creates a session (only available in test env)
  await page.goto('/api/test/create-session');
  // Now the browser has a session cookie — navigating to /dashboard works
}
```

```typescript
// src/app/api/test/create-session/route.ts
// ⚠️ THIS ROUTE ONLY EXISTS IN TEST ENVIRONMENT — never in production
import { NextResponse } from 'next/server';

export async function GET() {
  if (process.env.NODE_ENV !== 'test') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Create a real user in the test DB and return a session
  // Implementation depends on your NextAuth setup
  // For simplicity, you can mock a JWT cookie here
  const response = NextResponse.json({ ok: true });
  response.cookies.set('next-auth.session-token', 'test-session-token', {
    httpOnly: true,
    path: '/',
  });
  return response;
}
```

### 7.2 Page Object Model

```typescript
// src/__tests__/e2e/pages/dashboard.page.ts
// Page Object Model: encapsulates selectors and actions for a page.
// If the UI changes, you update it in ONE place, not every test.

import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly titleInput: Locator;
  readonly addButton: Locator;
  readonly todoList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titleInput = page.getByPlaceholder('What needs to be done?');
    this.addButton = page.getByRole('button', { name: /add task/i });
    this.todoList = page.getByRole('list');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async createTodo(title: string, priority?: string) {
    await this.titleInput.fill(title);
    if (priority) {
      await this.page.getByRole('combobox', { name: /priority/i }).selectOption(priority);
    }
    await this.addButton.click();
  }

  async completeTodo(title: string) {
    const item = this.page.getByText(title).locator('..');
    await item.getByRole('checkbox').click();
  }

  async deleteTodo(title: string) {
    const item = this.page.getByText(title).locator('..');
    this.page.on('dialog', dialog => dialog.accept());
    await item.getByRole('button', { name: /delete/i }).click();
  }

  async expectTodoVisible(title: string) {
    await expect(this.page.getByText(title)).toBeVisible();
  }

  async expectTodoNotVisible(title: string) {
    await expect(this.page.getByText(title)).not.toBeVisible();
  }

  async filterByStatus(status: 'All' | 'Pending' | 'Done') {
    await this.page.getByRole('button', { name: new RegExp(status, 'i') }).click();
  }
}
```

### 7.3 Auth E2E Tests

```typescript
// src/__tests__/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('redirects to /signin when visiting /dashboard while logged out', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/signin/);
  });

  test('shows sign in page with GitHub button', async ({ page }) => {
    await page.goto('/signin');
    await expect(page.getByRole('button', { name: /continue with github/i })).toBeVisible();
  });

  test('home page redirects to /dashboard when already logged in', async ({ page, context }) => {
    // Set session cookie to simulate being logged in
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: 'test-valid-session',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
      },
    ]);
    await page.goto('/');
    // Should redirect to dashboard if session is valid
    // In a real test, you'd set up a proper test session
  });

  test('unauthenticated API request returns 401', async ({ request }) => {
    const response = await request.get('/api/todos');
    expect(response.status()).toBe(401);
  });
});
```

### 7.4 Todo CRUD E2E Tests

```typescript
// src/__tests__/e2e/todos.spec.ts
import { test, expect } from '@playwright/test';
import { DashboardPage } from './pages/dashboard.page';

// NOTE: These E2E tests assume a test session can be established.
// For a junior project, focus on the unauthenticated flows first.
// Add authenticated flows as you learn more about Playwright auth setup.

test.describe('Todo CRUD flows', () => {
  test('shows empty state on first load', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // If redirected to signin, the auth is working correctly
    const url = page.url();
    if (url.includes('/signin')) {
      // This is correct behaviour — middleware is working
      expect(url).toContain('/signin');
    }
  });

  test('API returns 401 for unauthenticated todo creation', async ({ request }) => {
    const response = await request.post('/api/todos', {
      data: { title: 'Hacked todo' },
    });
    expect(response.status()).toBe(401);
  });

  test('API returns 401 for unauthenticated todo listing', async ({ request }) => {
    const response = await request.get('/api/todos');
    expect(response.status()).toBe(401);
  });

  test('API returns 401 for unauthenticated todo deletion', async ({ request }) => {
    const response = await request.delete('/api/todos/any-id');
    expect(response.status()).toBe(401);
  });

  // Full authenticated E2E flow — requires test session setup
  // Uncomment and implement when you have test auth configured:
  //
  // test('complete todo flow: create → complete → delete', async ({ page }) => {
  //   await loginAsTestUser(page);
  //   const dashboard = new DashboardPage(page);
  //   await dashboard.goto();
  //
  //   await dashboard.createTodo('My E2E test task');
  //   await dashboard.expectTodoVisible('My E2E test task');
  //
  //   await dashboard.completeTodo('My E2E test task');
  //   // check it has the done style
  //
  //   await dashboard.deleteTodo('My E2E test task');
  //   await dashboard.expectTodoNotVisible('My E2E test task');
  // });
});
```

---

## 8. Test Utilities & Factories

### 8.1 Render Helper

```typescript
// src/__tests__/helpers/render.tsx
// One function to render any component with all required providers.
// Import THIS instead of @testing-library/react in component tests.

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function AllProviders({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Custom render — use this everywhere instead of raw render()
export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from Testing Library so you only need one import
export * from '@testing-library/react';
export { renderWithProviders as render };
```

---

## 9. CI Integration

Update your existing `.github/workflows/ci.yml` to run all tests:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # ── Quality checks (fast — run first) ──────────────────────────────────────
  quality:
    name: Type Check & Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx prisma generate
        env:
          DATABASE_URL: "postgresql://fake:fake@localhost:5432/fake"
          DIRECT_URL: "postgresql://fake:fake@localhost:5432/fake"
      - run: npm run type-check
      - run: npm run lint
      - run: npx prettier --check .

  # ── Unit & Integration tests ───────────────────────────────────────────────
  test:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    needs: quality  # only run if quality passes
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx prisma generate
        env:
          DATABASE_URL: "postgresql://fake:fake@localhost:5432/fake"
          DIRECT_URL: "postgresql://fake:fake@localhost:5432/fake"

      - name: Run unit and integration tests
        run: npm run test:coverage
        env:
          DATABASE_URL: "postgresql://fake:fake@localhost:5432/fake"
          DIRECT_URL: "postgresql://fake:fake@localhost:5432/fake"
          NEXTAUTH_SECRET: "test-secret-32-chars-minimum-fake-ok"
          NEXTAUTH_URL: "http://localhost:3000"

      - name: Upload coverage report
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}  # optional but good practice
        if: always()  # upload even if tests fail (to see what's covered)

  # ── E2E tests (slow — run last, only on main) ──────────────────────────────
  e2e:
    name: E2E Tests (Playwright)
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'  # only run on main, not every PR
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium

      - name: Build the app
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          NEXTAUTH_URL: "http://localhost:3000"

      - name: Run Playwright E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          NEXTAUTH_URL: "http://localhost:3000"

      - name: Upload Playwright report on failure
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

---

## 10. GitHub Issue for Testing Sprint

Copy this into a new GitHub issue:

```
TITLE:
[Testing] Write unit, integration, component and E2E tests for all features

LABELS: chore

DESCRIPTION:
## Goal
Add a full test suite covering all layers of the testing pyramid.
Tests are not optional — they are what makes the project professional.

## Package installation
- [ ] Install Jest, ts-jest, @testing-library/react, @testing-library/user-event
- [ ] Install @testing-library/jest-dom, jest-mock-extended, next-router-mock
- [ ] Install msw (Mock Service Worker)
- [ ] Install @playwright/test and run: npx playwright install

## Config files to create
- [ ] jest.config.ts
- [ ] jest.setup.ts
- [ ] .env.test
- [ ] playwright.config.ts
- [ ] Update package.json scripts

## Helper files to create
- [ ] src/__tests__/helpers/mock-prisma.ts
- [ ] src/__tests__/helpers/mock-auth.ts
- [ ] src/__tests__/helpers/factories.ts
- [ ] src/__tests__/helpers/msw-handlers.ts
- [ ] src/__tests__/helpers/msw-server.ts
- [ ] src/__tests__/helpers/render.tsx

## Unit tests (Jest)
- [ ] src/__tests__/unit/validations.test.ts
- [ ] src/__tests__/unit/api-helpers.test.ts

## Integration tests (Jest + mocked Prisma)
- [ ] src/__tests__/integration/todos.collection.test.ts  (GET + POST)
- [ ] src/__tests__/integration/todos.resource.test.ts    (PATCH + DELETE)

## Component tests (Jest + Testing Library + MSW)
- [ ] src/__tests__/components/todo-form.test.tsx
- [ ] src/__tests__/components/todo-item.test.tsx
- [ ] src/__tests__/components/todo-list.test.tsx

## E2E tests (Playwright)
- [ ] src/__tests__/e2e/auth.spec.ts
- [ ] src/__tests__/e2e/todos.spec.ts

## CI update
- [ ] Update .github/workflows/ci.yml to run tests on every PR

## Acceptance criteria
- [ ] `npm test` exits 0 with no test failures
- [ ] `npm run test:coverage` shows 70%+ line coverage
- [ ] `npm run test:e2e` passes against local dev server
- [ ] CI runs tests on every PR and fails on test failure

## Branch
feature/#21-testing

## Sprint
Sprint 3 (or add a dedicated Sprint 4)
```

---

## 11. What to Say in Interviews

```
"My testing strategy follows the testing pyramid:

Unit tests with Jest cover my Zod validation schemas and utility
functions — these are pure functions that run in milliseconds with
no external dependencies.

Integration tests mock the Prisma client with jest-mock-extended
and mock NextAuth's getServerSession, so I can test my actual API
route handler logic — including security rules like checking that
userId always comes from the server session and never from the
request body.

Component tests use React Testing Library and Mock Service Worker.
MSW intercepts real fetch() calls at the network layer, so I'm
testing the component the way a user actually interacts with it —
typing, clicking, waiting for loading states — not just asserting
on rendered output.

End-to-end tests use Playwright and drive a real Chromium browser.
These cover the full authentication redirect flow and the critical
unauthenticated API paths.

The whole suite runs in GitHub Actions on every PR. The job is split:
quality checks first (lint + typecheck, fast), then unit and
integration tests, then E2E only on merges to main to keep PR
feedback fast."

This shows you understand: what to test, why to test it, and
how to structure tests at scale. That's senior-level thinking
applied at a junior project.
```

---

*Tests are the professional's safety net. Write them as you build, not after.*
