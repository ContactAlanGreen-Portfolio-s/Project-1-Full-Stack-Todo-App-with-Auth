// src/app/(dashboard)/dashboard/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The main application page — shows the user's todo list and add-task form.
//
// WHY A SERVER COMPONENT?
// This page uses `async/await` and runs on the server. That means:
//   • The session is checked before ANY HTML is sent to the browser
//   • SEO-friendly: the initial HTML includes the page structure
//   • No JavaScript needed for the auth check itself
//
// ROUTE GROUP: (dashboard)
// The parentheses in (dashboard) create a "route group" — it organises files
// without affecting the URL. The route is still /dashboard, not /(dashboard)/dashboard.
// This lets us have a separate layout.tsx for dashboard pages (e.g. with a nav bar)
// versus auth pages (just a centered card).
//
// AUTH STRATEGY:
// The middleware already blocks unauthenticated users before they reach here.
// The `if (!session) redirect()` below is a belt-and-suspenders safety net —
// it handles the edge case where middleware is bypassed or misconfigured.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TodoForm } from "@/components/todos/todo-form";
import { TodoList } from "@/components/todos/todo-list";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// This is a React Server Component (RSC) — it's async and runs only on the server.
// There is NO useState, useEffect, or browser APIs here.
export default async function DashboardPage() {
  // Read the session from the request cookie — synchronous from the server's perspective.
  // Returns null if the user is not authenticated.
  const session = await getServerSession(authOptions);

  // Belt-and-suspenders auth check. Middleware (middleware.ts) already protects
  // this route, but we add this as a safety net. redirect() throws a special
  // Next.js exception that is caught internally and triggers a 302 redirect.
  if (!session) redirect("/signin");

  return (
    <main className="container max-w-2xl mx-auto px-4 py-8">
      {/* ── User greeting ────────────────────────────────────────────────── */}
      {/* Shows the user's avatar and name/email from their GitHub profile */}
      <div className="flex items-center gap-3 mb-8">
        <Avatar>
          {/* AvatarImage tries to load the GitHub profile photo */}
          <AvatarImage
            src={session.user?.image ?? ""}
            alt={session.user?.name ?? ""}
          />
          {/* AvatarFallback shows the first letter of the name if photo fails */}
          <AvatarFallback>
            {session.user?.name?.charAt(0).toUpperCase() ?? "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold">Welcome, {session.user?.name}</h1>
          <p className="text-sm text-muted-foreground">{session.user?.email}</p>
        </div>
      </div>

      {/* ── Add task card ────────────────────────────────────────────────── */}
      {/* TodoForm is a Client Component ("use client") — it has form state */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add a task</CardTitle>
          <CardDescription>What do you need to get done?</CardDescription>
        </CardHeader>
        <CardContent>
          <TodoForm />
        </CardContent>
      </Card>

      {/* ── Task list card ───────────────────────────────────────────────── */}
      {/* TodoList is a Client Component — it fetches and displays todos */}
      <Card>
        <CardHeader>
          <CardTitle>Your tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <TodoList />
        </CardContent>
      </Card>
    </main>
  );
}

// SEO metadata for this page — sets the <title> tag in the browser tab
export const metadata = {
  title: "Dashboard — Todo App",
};
