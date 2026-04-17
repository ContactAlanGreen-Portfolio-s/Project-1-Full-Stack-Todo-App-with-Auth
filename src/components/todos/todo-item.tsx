// src/components/todos/todo-item.tsx
// ─────────────────────────────────────────────────────────────────────────────
// A single todo card. Displays title, priority badge, due date, and action
// buttons (toggle completion + delete).
//
// "use client" — uses event handlers (onClick, onCheckedChange) and hooks,
// which require the browser environment.
//
// PROPS:
// • todo — the full Todo object from the database (id, title, status, etc.)
//
// INTERACTIONS:
// • Checkbox clicked → calls PATCH /api/todos/:id to toggle status
// • Delete button clicked → confirms, then calls DELETE /api/todos/:id
// Both use React Query mutations from use-todos.ts which handle caching.

"use client";

import { format } from "date-fns";         // date formatting utility
import { Trash2, Calendar, Loader2 } from "lucide-react"; // icons
import { useUpdateTodo, useDeleteTodo } from "@/hooks/use-todos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils"; // Tailwind class merger
import type { Todo } from "@/types";

// ── Priority badge styles ──────────────────────────────────────────────────────
// Lookup table that maps a priority level to its Tailwind colour classes.
// Using a constant object is cleaner than a switch/if-else chain.
const PRIORITY_STYLES: Record<string, string> = {
  HIGH:   "bg-red-100 text-red-700 border-red-200",
  MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-200",
  LOW:    "bg-green-100 text-green-700 border-green-200",
};

// ── Component props type ───────────────────────────────────────────────────────
interface TodoItemProps {
  todo: Todo; // the full todo record from the useTodos() query
}

export function TodoItem({ todo }: TodoItemProps) {
  // Mutations from React Query — each provides { mutate, isPending }
  const { mutate: updateTodo, isPending: isUpdating } = useUpdateTodo();
  const { mutate: deleteTodo, isPending: isDeleting } = useDeleteTodo();

  // Derived boolean — reduces repetitive `todo.status === "DONE"` checks below
  const isCompleted = todo.status === "DONE";

  // ── Toggle handler ────────────────────────────────────────────────────────
  // Called when the checkbox is clicked. Sends a PATCH request to flip the status.
  // The mutation shape `{ id, data: { status } }` matches useUpdateTodo's mutationFn.
  function handleToggle() {
    updateTodo({
      id: todo.id,
      data: { status: isCompleted ? "PENDING" : "DONE" },
      // If done → reopen it (PENDING); if pending → mark complete (DONE)
    });
  }

  // ── Delete handler ────────────────────────────────────────────────────────
  // Shows a native browser confirm dialog before sending the DELETE request.
  // If the user clicks Cancel, nothing happens.
  function handleDelete() {
    if (window.confirm("Delete this task?")) {
      deleteTodo(todo.id); // mutationFn receives just the string id
    }
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 transition-all",
        // Completed todos are dimmed to visually separate them from active ones
        isCompleted && "bg-muted/50 opacity-60",
      )}
    >
      {/* ── Checkbox ─────────────────────────────────────────────────────── */}
      <Checkbox
        checked={isCompleted}          // reflects current DB status
        onCheckedChange={handleToggle} // fires on click
        disabled={isUpdating}          // prevent double-clicks while saving
        className="mt-0.5"             // align with first line of text
      />

      {/* ── Content (title, description, badges) ─────────────────────────── */}
      <div className="flex-1 min-w-0"> {/* min-w-0 allows text to truncate */}
        <p
          className={cn(
            "font-medium truncate", // truncate long titles with ellipsis
            isCompleted && "line-through text-muted-foreground", // visual strikethrough
          )}
        >
          {todo.title}
        </p>

        {/* Description — only rendered if one was provided */}
        {todo.description && (
          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
            {todo.description}
          </p>
        )}

        {/* ── Metadata badges (priority + due date) ───────────────────── */}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {/* Priority badge — colour determined by PRIORITY_STYLES lookup */}
          <Badge
            variant="outline"
            className={cn("text-xs", PRIORITY_STYLES[todo.priority])}
          >
            {/* Show lowercase priority ("high", "medium", "low") */}
            {todo.priority.toLowerCase()}
          </Badge>

          {/* Due date — only shown if the todo has one */}
          {todo.dueDate && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {/* format() from date-fns: Date → "Dec 25, 2025" */}
              {format(new Date(todo.dueDate), "MMM d, yyyy")}
            </span>
          )}
        </div>
      </div>

      {/* ── Delete button ─────────────────────────────────────────────────── */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={handleDelete}
        disabled={isDeleting} // prevent double-clicks while deleting
        aria-label="Delete task" // screen reader label (no visible text)
      >
        {/* Show a spinner while deletion is in-flight, trash icon otherwise */}
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        {/* sr-only: visible to screen readers but hidden visually */}
        <span className="sr-only">Delete task</span>
      </Button>
    </div>
  );
}
