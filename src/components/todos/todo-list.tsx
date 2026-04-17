// src/components/todos/todo-list.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Displays the user's list of todos with filter tabs (All / Pending / Done).
//
// "use client" — this component uses React state and React Query, both of
// which require the browser environment. It cannot run as a Server Component.
//
// RENDERING STATES:
// The component handles four distinct UI states:
//   1. Loading — skeleton placeholders while the first fetch completes
//   2. Error — error banner with a "Try again" button
//   3. Empty — friendly illustration when no todos match the current filter
//   4. Data — the filtered list of TodoItem components
"use client";

import { useMemo, useState } from "react";
import { useTodos } from "@/hooks/use-todos";
import { TodoItem } from "./todo-item";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TodoStatus } from "@/types";

// Filter type: either show all todos or filter by a specific status value.
// "ALL" is our custom addition; "PENDING" and "DONE" come from the DB enum.
type Filter = "ALL" | TodoStatus;

export function TodoList() {
  // Destructure the query result — React Query manages loading/error/data lifecycle
  const { data, isLoading, error, refetch } = useTodos();

  // Local UI state for the active filter tab (not persisted, resets on page load)
  const [filter, setFilter] = useState<Filter>("ALL");

  // ── Derived data (memoised) ────────────────────────────────────────────────
  // useMemo caches the filtered array and only recomputes when `data` or `filter`
  // changes — prevents unnecessary array iterations on every render.
  const filteredTodos = useMemo(() => {
    if (!data?.data) return []; // guard: data not yet loaded
    if (filter === "ALL") return data.data; // no filtering needed
    return data.data.filter((t) => t.status === filter); // client-side filter
  }, [data, filter]);

  // ── Loading state ─────────────────────────────────────────────────────────
  // React Query sets isLoading = true on the very first fetch.
  // We show animated skeleton placeholders to prevent layout shift.
  if (isLoading) {
    return (
      <div className="space-y-3">
        {/* Array.from creates 4 skeleton cards with unique keys */}
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  // Shown if the network request fails (e.g. server offline, 500 error).
  // The "Try again" button calls refetch() which re-runs the useQuery queryFn.
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
        <AlertCircle className="h-6 w-6" />
        <p className="text-sm font-medium">Failed to load tasks.</p>
        <button
          onClick={() => refetch()} // trigger a manual refetch
          className="text-xs underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  // Two scenarios for an empty filtered list:
  //   a) No todos at all: "No tasks yet — Add a task above to get started."
  //   b) Filter produces empty results: "No pending tasks — Change your filter."
  if (filteredTodos.length === 0) {
    // isFilterEmpty is true when the user HAS todos but the current filter hides them
    const isFilterEmpty = data?.data && data.data.length > 0;

    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="font-semibold text-muted-foreground">
          {isFilterEmpty ? `No ${filter.toLowerCase()} tasks` : "No tasks yet"}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {isFilterEmpty
            ? "Change your filter to see more."
            : "Add a task above to get started."}
        </p>
      </div>
    );
  }

  // ── Data state: filter tabs + list ────────────────────────────────────────
  return (
    <div className="space-y-2">
      {/* ── Filter tabs ────────────────────────────────────────────────── */}
      <div className="flex gap-2 border-b pb-3 mb-4">
        {/* Map over the three filter options to create tab buttons */}
        {(["ALL", "PENDING", "DONE"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)} // update local state → triggers memoised filter
            className={cn(
              "px-3 py-1 text-sm rounded-md transition-colors",
              // Active tab gets primary colour; inactive tabs show muted text
              filter === f
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {/* "ALL" becomes "All (5)"; "PENDING" becomes "Pending"; "DONE" → "Done" */}
            {f === "ALL"
              ? `All (${data?.count ?? 0})`          // show total count from API
              : f.charAt(0) + f.slice(1).toLowerCase() // title-case the enum value
            }
          </button>
        ))}
      </div>

      {/* ── Todo items ────────────────────────────────────────────────── */}
      {/* Each TodoItem receives the full todo object; key prevents React DOM confusion */}
      {filteredTodos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  );
}
