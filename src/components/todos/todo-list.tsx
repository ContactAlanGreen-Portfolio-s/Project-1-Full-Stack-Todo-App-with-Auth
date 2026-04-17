// src/components/todos/todo-list.tsx
"use client";

import { useMemo, useState } from "react";
import { useTodos } from "@/hooks/use-todos";
import { TodoItem } from "./todo-item";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TodoStatus, Priority } from "@/types";

type Filter = "ALL" | TodoStatus;

export function TodoList() {
  const { data, isLoading, error, refetch } = useTodos();
  const [filter, setFilter] = useState<Filter>("ALL");

  const filteredTodos = useMemo(() => {
    if (!data?.data) return [];
    if (filter === "ALL") return data.data;
    return data.data.filter((t) => t.status === filter);
  }, [data, filter]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
        <AlertCircle className="h-6 w-6" />
        <p className="text-sm font-medium">Failed to load tasks.</p>
        <button
          onClick={() => refetch()}
          className="text-xs underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // Empty state
  if (filteredTodos.length === 0) {
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

  return (
    <div className="space-y-2">
      {/* Filter tabs */}
      <div className="flex gap-2 border-b pb-3 mb-4">
        {(["ALL", "PENDING", "DONE"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1 text-sm rounded-md transition-colors",
              filter === f
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f === "ALL"
              ? `All (${data?.count ?? 0})`
              : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Todo items */}
      {filteredTodos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  );
}
