// src/hooks/use-todos.ts
// ─────────────────────────────────────────────────────────────────────────────
// Custom React Query hooks for all todo CRUD operations.
//
// WHY HOOKS INSTEAD OF RAW fetch() IN COMPONENTS?
// • Single source of truth — changing the API URL or response shape means
//   updating ONE file, not hunting through every component.
// • Automatic caching — React Query stores results in a client-side cache
//   keyed by TODOS_KEY. Multiple components can subscribe to the same query
//   without duplicating network requests.
// • Optimistic updates — the UI updates instantly; if the server fails the
//   old state is rolled back automatically.
// • Toast notifications — success/error feedback lives here, not in components.
//
// ARCHITECTURE:
//   Component → calls hook → hook calls fetchJSON → server API route
//                         ← React Query caches the result
//                         ← Component re-renders with fresh data

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateTodoInput, UpdateTodoInput, Todo } from "@/types";

// ── Cache key ──────────────────────────────────────────────────────────────────
// React Query uses this array as the unique identifier for the todos cache.
// Using `as const` ensures TypeScript treats it as a readonly tuple, not a
// mutable string array — important for type inference in queryClient.setQueryData.
const TODOS_KEY = ["todos"] as const;

// ── Shared fetch helper ────────────────────────────────────────────────────────
// A typed wrapper around the browser's fetch() API.
// Generic parameter T tells TypeScript what shape the resolved value will be.
// This avoids writing JSON.parse / error-check boilerplate in every hook.
async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" }, // tell the server it's JSON
    cache: "no-store",   // bypass the Next.js fetch cache — we use React Query instead
    ...options,          // spread caller options last so they can override the above
  });

  // Throw on non-2xx responses. React Query will call onError automatically.
  if (!res.ok) {
    // Try to parse a JSON error body; fall back to a generic message.
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  // 204 No Content (DELETE success) — no body to parse, return null typed as T
  if (res.status === 204) return null as T;

  const json = await res.json();

  // Unwrap single-property `{ data: ... }` envelopes (e.g. from a POST/PATCH).
  // For GET /api/todos we return `{ data: [...], count: N }` — we DON'T unwrap
  // because `count` is a second property that the component needs.
  if (json.data !== undefined && Object.keys(json).length === 1) {
    return json.data; // strip the envelope: { data: todo } → todo
  }
  return json ?? null;
}

// ── useTodos — fetch the list of todos ────────────────────────────────────────
// useQuery handles: loading state, error state, caching, background refetching.
// Components read `{ data, isLoading, isError }` from the returned object.
export function useTodos() {
  return useQuery({
    queryKey: TODOS_KEY, // cache key — React Query deduplicates identical keys
    // queryFn is called when data is stale or the component mounts fresh.
    // The return type tells TS what `data` will be once loaded.
    queryFn: () => fetchJSON<{ data: Todo[]; count: number }>("/api/todos"),
  });
}

// ── useCreateTodo — POST /api/todos ──────────────────────────────────────────
// Uses an OPTIMISTIC UPDATE strategy for instant UI feedback:
// 1. onMutate: inject the new todo into the cache immediately (fake id)
// 2. mutationFn: send the real POST request to the server
// 3. onSuccess: toast the user, onSettled: sync cache with server truth
// 4. onError: roll back the optimistic update and toast the error
export function useCreateTodo() {
  // useQueryClient gives us access to the React Query cache
  const queryClient = useQueryClient();

  return useMutation({
    // The actual network call — receives the form values from form.handleSubmit
    mutationFn: (data: CreateTodoInput) =>
      fetchJSON<Todo>("/api/todos", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    // ── OPTIMISTIC UPDATE ───────────────────────────────────────────────────
    // Called synchronously BEFORE the network request starts.
    onMutate: async (newTodo) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic state
      await queryClient.cancelQueries({ queryKey: TODOS_KEY });

      // Snapshot the current cache value so we can roll back on error
      const previous = queryClient.getQueryData(TODOS_KEY);

      // Inject a placeholder todo into the cache with a temporary id.
      // The component renders this immediately — zero perceived latency.
      queryClient.setQueryData(
        TODOS_KEY,
        (old: { data: Todo[]; count: number } | undefined) => ({
          ...old,               // keep the count and other metadata
          count: (old?.count || 0) + 1,
          data: [
            {
              id: "temp-" + Date.now(), // temporary id replaced after server responds
              ...newTodo,
              status: "PENDING",        // new todos are always pending
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as unknown as Todo,
            ...(old?.data || []),       // prepend to the existing list
          ],
        }),
      );

      // Return the snapshot as context — available in onError for rollback
      return { previous };
    },

    // Roll back the optimistic update and show an error toast
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(TODOS_KEY, context?.previous);
      toast.error("Failed to create task");
    },

    // onSettled fires whether the mutation succeeds OR fails.
    // Invalidating forces React Query to refetch from the server,
    // replacing the optimistic placeholder with the real data.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_KEY });
    },

    onSuccess: () => {
      toast.success("Task created");
    },
  });
}

// ── useUpdateTodo — PATCH /api/todos/:id ─────────────────────────────────────
// Used when toggling a todo's status (PENDING ↔ DONE) or editing fields.
// No optimistic update here — we wait for server confirmation then invalidate.
export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    // `id` identifies which todo to patch; `data` is the partial update payload.
    mutationFn: ({ id, data }: { id: string; data: UpdateTodoInput }) =>
      fetchJSON<Todo>(`/api/todos/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    // After any update (success or failure), refresh the todos list
    // so the UI reflects the real database state.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_KEY });
    },

    // Show a contextual toast based on what the user actually changed.
    // `variables` gives us the exact arguments passed to mutate().
    onSuccess: (_, variables) => {
      if (variables.data.status === "DONE") {
        toast.success("Task completed"); // user checked the checkbox
      } else if (variables.data.status === "PENDING") {
        toast.success("Task reopened"); // user unchecked the checkbox
      } else {
        toast.success("Task updated"); // user edited title/description/etc.
      }
    },

    onError: () => {
      toast.error("Failed to update task");
    },
  });
}

// ── useDeleteTodo — DELETE /api/todos/:id ────────────────────────────────────
// Sends a DELETE request and invalidates the cache on completion.
// The component confirms with the user before calling mutate(id).
export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    // `id` is a plain string — the todo's CUID primary key
    mutationFn: (id: string) =>
      fetchJSON<null>(`/api/todos/${id}`, { method: "DELETE" }),

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_KEY });
    },

    onSuccess: () => {
      toast.success("Task deleted");
    },

    onError: () => {
      toast.error("Failed to delete task");
    },
  });
}
