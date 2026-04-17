// src/hooks/use-todos.ts
// WHY: Centralise all todo API calls in one place.
// Components import hooks, not fetch() calls directly.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateTodoInput, UpdateTodoInput, Todo } from "@/types";

const TODOS_KEY = ["todos"] as const;

// Typed fetch helper
async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store", // <-- ADD THIS LINE
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  if (res.status === 204) return null as T;
  const json = await res.json();
  // If json.data exists, return it. Otherwise, just return the raw json.
  // The ?? null ensures we NEVER return undefined.
  return json.data !== undefined ? json.data : (json ?? null);
}

// ─── Queries (read) ───────────────────────────────────────────────────────────

export function useTodos() {
  return useQuery({
    queryKey: TODOS_KEY,
    queryFn: () => fetchJSON<{ data: Todo[]; count: number }>("/api/todos"),
  });
}

// ─── Mutations (write) ────────────────────────────────────────────────────────

export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTodoInput) =>
      fetchJSON<Todo>("/api/todos", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    // Optimistic update: show the todo immediately, before server confirms
    onMutate: async (newTodo) => {
      await queryClient.cancelQueries({ queryKey: TODOS_KEY });
      const previous = queryClient.getQueryData(TODOS_KEY);

      queryClient.setQueryData(
        TODOS_KEY,
        (old: { data: Todo[] } | undefined) => ({
          ...old,
          data: [
            {
              id: "temp-" + Date.now(),
              ...newTodo,
              status: "PENDING",
              createdAt: new Date().toISOString(),
            },
            // Use optional chaining fallback in case old.data is undefined
            ...(old?.data || []),
          ],
        }),
      );

      return { previous };
    },

    onError: (_err, _vars, context) => {
      // Rollback optimistic update on error
      queryClient.setQueryData(TODOS_KEY, context?.previous);
      toast.error("Failed to create task");
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_KEY }); // refetch real data
      toast.success("Task created");
    },
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTodoInput }) =>
      fetchJSON<Todo>(`/api/todos/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_KEY });
    },

    onError: () => {
      toast.error("Failed to update task");
    },
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchJSON<null>(`/api/todos/${id}`, { method: "DELETE" }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_KEY });
      toast.success("Task deleted");
    },

    onError: () => {
      toast.error("Failed to delete task");
    },
  });
}
