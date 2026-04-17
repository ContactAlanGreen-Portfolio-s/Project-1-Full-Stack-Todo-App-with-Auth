// src/components/todos/todo-form.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The "Add a task" form — collects title, description, and priority from the user.
//
// "use client" — uses React Hook Form state and browser event handlers.
//
// FORM ARCHITECTURE:
// We use react-hook-form + Zod for validation. The flow is:
//   1. User types in the form fields (controlled by react-hook-form)
//   2. User clicks "Add Task"
//   3. react-hook-form runs Zod validation via zodResolver
//   4. If validation FAILS → field errors are shown inline (no network request)
//   5. If validation PASSES → onSubmit is called with the clean data
//   6. useCreateTodo().mutate(data) sends POST /api/todos
//   7. On success → form resets to empty; toast notification shown
//   8. On error → form stays filled so the user can retry; error toast shown
//
// SHADCN/UI FORM COMPONENTS:
// The Form, FormField, FormItem, FormLabel, FormControl, FormMessage components
// from Shadcn/ui wire react-hook-form state to the underlying input elements
// automatically. FormMessage reads the field's error and renders it.

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"; // bridges Zod and RHF
import { createTodoSchema, CreateTodoInput } from "@/lib/validations";
import { useCreateTodo } from "@/hooks/use-todos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { z } from "zod";

export function TodoForm() {
  // Destructure the mutation's loading state and mutate function
  const { mutate: createTodo, isPending } = useCreateTodo();

  // Initialise react-hook-form with:
  //   • resolver: delegates validation to our Zod schema
  //   • defaultValues: sets the initial state of each field
  const form = useForm<z.input<typeof createTodoSchema>>({
    resolver: zodResolver(createTodoSchema),
    defaultValues: {
      title: "",           // start with empty title (required field)
      description: "",     // start with empty description (optional)
      priority: "MEDIUM",  // default priority — matches Zod schema default
    },
  });

  // ── Submit handler ──────────────────────────────────────────────────────────
  // Called by form.handleSubmit() ONLY when Zod validation passes.
  // If validation fails, this function is never called — react-hook-form
  // populates form.formState.errors instead.
  function onSubmit(values: z.input<typeof createTodoSchema>) {
    createTodo(values as CreateTodoInput, {
      // Clear the form ONLY after the server confirms the todo was saved.
      // If we reset on optimistic update, the user's input disappears before
      // the server even responds — bad UX if there's a network error.
      onSuccess: () => form.reset(),
    });
  }

  // Form is the react-hook-form FormProvider — it passes the form context
  // down to all FormField children without manual prop drilling
  return (
    <Form {...form}>
      {/* form.handleSubmit wraps our onSubmit: validates first, then calls onSubmit */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        {/* ── Title field ─────────────────────────────────────────────── */}
        <FormField
          control={form.control as any}  // connects this field to the form context
          name="title"            // must match a key in defaultValues / schema
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task title</FormLabel>
              <FormControl>
                {/* `...field` spreads: value, onChange, onBlur, ref from RHF */}
                <Input
                  placeholder="What needs to be done?"
                  disabled={isPending} // lock form while mutation is in-flight
                  {...field}
                />
              </FormControl>
              {/* FormMessage reads the error from form.formState.errors.title
                  and renders it as a red paragraph. Shows nothing if no error. */}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Description field ────────────────────────────────────────── */}
        <FormField
          control={form.control as any}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add more details..."
                  rows={2}
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Priority select ──────────────────────────────────────────── */}
        <FormField
          control={form.control as any}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              {/* Select from Shadcn/ui — uses Radix UI under the hood for accessibility */}
              <Select
                onValueChange={field.onChange} // update RHF when user picks an option
                defaultValue={field.value}      // pre-select the current value
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Submit button ────────────────────────────────────────────── */}
        {/* Disabled while the mutation is pending to prevent duplicate submissions */}
        <Button type="submit" disabled={isPending} className="w-full">
          {/* Show different text during loading so the user knows what's happening */}
          {isPending ? "Adding..." : "Add Task"}
        </Button>
      </form>
    </Form>
  );
}
