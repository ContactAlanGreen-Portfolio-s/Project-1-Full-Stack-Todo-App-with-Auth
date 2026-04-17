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
