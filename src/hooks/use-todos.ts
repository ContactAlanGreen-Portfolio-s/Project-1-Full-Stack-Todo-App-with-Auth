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
  // Only strip 'data' wrapper if it's the only property (for single-item mutations)
  // If there are other properties like 'count', keep the full response
  if (json.data !== undefined && Object.keys(json).length === 1) {
    return json.data;
  }
  return json ?? null;
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
        (old: { data: Todo[]; count: number } | undefined) => ({
          ...old,
          count: (old?.count || 0) + 1,
          data: [
            {
              id: "temp-" + Date.now(),
              ...newTodo,
              status: "PENDING",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as unknown as Todo,
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

    // onSettled fires whether the mutation succeeds OR fails.
    // It guarantees our UI syncs up perfectly with the real database.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_KEY });
    },

    onSuccess: () => {
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

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_KEY });
    },

    onSuccess: (_, variables) => {
      if (variables.data.status === "DONE") {
        toast.success("Task completed");
      } else if (variables.data.status === "PENDING") {
        toast.success("Task reopened");
      } else {
        toast.success("Task updated");
      }
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
