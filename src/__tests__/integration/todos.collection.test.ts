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
    expect(body.data).toEqual([]);
    expect(body.count).toBe(0);
  });

  it('returns only the authenticated user\'s todos', async () => {
    const userId = 'user-cuid-123';
    mockAuthenticated({ id: userId });

    const userTodos = createTodos(3, { userId });
    prismaMock.todo.findMany.mockResolvedValue(userTodos);

    const req = makeRequest('GET');
    const { status, body } = await parseResponse(await GET(req));

    expect(status).toBe(200);
    expect(body.count).toBe(3);

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
    expect(body.title).toBe('Buy milk');
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
