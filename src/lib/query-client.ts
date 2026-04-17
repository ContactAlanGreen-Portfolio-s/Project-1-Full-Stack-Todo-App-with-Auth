// src/lib/query-client.ts
// ─────────────────────────────────────────────────────────────────────────────
// Factory function that creates a configured React Query client.
//
// WHY A FACTORY FUNCTION instead of a module-level constant?
// Next.js App Router renders both on the server (RSC) and in the browser.
// If we exported a single QueryClient instance, it would be shared across
// all server requests — leaking state between users. The factory lets each
// server render (and the browser's hydration) create its own isolated client.
//
// This is used in:
//   - src/app/layout.tsx (server side, creates once per request)
//   - src/__tests__/components/*.test.tsx (test wrappers, fresh per test)

import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered "fresh" for 60 seconds after it was last fetched.
        // During this window React Query will NOT re-fetch, even if the component
        // remounts. After 60 s it becomes "stale" and will re-fetch on next use.
        staleTime: 60 * 1000,

        // If a request fails, retry it once before reporting an error.
        // This handles transient network blips without spamming the server.
        retry: 1,

        // Don't re-fetch when the user switches back to the browser tab.
        // Our data doesn't change that frequently, so this prevents noise.
        refetchOnWindowFocus: false,
      },
    },
  });
}
