// src/lib/query-client.ts
import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute — don't refetch unnecessarily
        retry: 1, // retry failed requests once
        refetchOnWindowFocus: false, // don't refetch when user tabs back
      },
    },
  });
}
