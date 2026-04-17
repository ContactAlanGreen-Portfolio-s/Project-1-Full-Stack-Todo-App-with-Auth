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
    expect(body.status).toBe('DONE');
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
