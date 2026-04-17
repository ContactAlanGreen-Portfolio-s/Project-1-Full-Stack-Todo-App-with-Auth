import { http, HttpResponse } from 'msw';
import { createTodo, createTodos } from './factories';

// These handlers simulate your real API responses
export const handlers = [
  // GET /api/todos — returns 3 test todos
  http.get('/api/todos', () => {
    const todos = createTodos(3);
    return HttpResponse.json({ data: todos, count: todos.length });
  }),

  // POST /api/todos — creates and returns a new todo
  http.post('/api/todos', async ({ request }) => {
    const body = await request.json() as { title: string };
    const todo = createTodo({ title: body.title });
    return HttpResponse.json(todo, { status: 201 });
  }),

  // PATCH /api/todos/:id — returns updated todo
  http.patch('/api/todos/:id', async ({ params, request }) => {
    const body = await request.json() as Record<string, string>;
    const todo = createTodo({ id: params.id as string, ...body });
    return HttpResponse.json(todo);
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
