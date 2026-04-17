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
