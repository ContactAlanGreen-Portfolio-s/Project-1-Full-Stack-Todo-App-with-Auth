// src/components/todos/todo-item.tsx
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Trash2, Calendar, Loader2 } from "lucide-react";
import { useUpdateTodo, useDeleteTodo } from "@/hooks/use-todos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Todo } from "@/types";

const PRIORITY_STYLES = {
  HIGH: "bg-red-100 text-red-700 border-red-200",
  MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-200",
  LOW: "bg-green-100 text-green-700 border-green-200",
};

interface TodoItemProps {
  todo: Todo;
}

export function TodoItem({ todo }: TodoItemProps) {
  const { mutate: updateTodo, isPending: isUpdating } = useUpdateTodo();
  const { mutate: deleteTodo, isPending: isDeleting } = useDeleteTodo();

  const isCompleted = todo.status === "DONE";

  function handleToggle() {
    updateTodo({
      id: todo.id,
      data: { status: isCompleted ? "PENDING" : "DONE" },
    });
  }

  function handleDelete() {
    if (window.confirm("Delete this task?")) {
      deleteTodo(todo.id);
    }
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 transition-all",
        isCompleted && "bg-muted/50 opacity-60",
      )}
    >
      {/* Checkbox */}
      <Checkbox
        checked={isCompleted}
        onCheckedChange={handleToggle}
        disabled={isUpdating}
        className="mt-0.5"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-medium truncate",
            isCompleted && "line-through text-muted-foreground",
          )}
        >
          {todo.title}
        </p>

        {todo.description && (
          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
            {todo.description}
          </p>
        )}

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className={cn("text-xs", PRIORITY_STYLES[todo.priority])}
          >
            {todo.priority.toLowerCase()}
          </Badge>

          {todo.dueDate && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(todo.dueDate), "MMM d, yyyy")}
            </span>
          )}
        </div>
      </div>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        <span className="sr-only">Delete task</span>
      </Button>
    </div>
  );
}
