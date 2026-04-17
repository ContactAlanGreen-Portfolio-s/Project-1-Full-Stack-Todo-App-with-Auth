import { Page } from '@playwright/test';

// Seed the browser with a valid session cookie before the test runs
// This avoids the GitHub OAuth redirect flow entirely
export async function loginAsTestUser(page: Page) {
  // Hit a test-only API route that creates a session (only available in test env)
  await page.goto('/api/test/create-session');
  // Now the browser has a session cookie — navigating to /dashboard works
}
