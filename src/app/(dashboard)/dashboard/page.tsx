// src/app/(dashboard)/dashboard/page.tsx
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

// This is a SERVER component — it runs on the server
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // Belt-and-suspenders auth check (middleware handles this, but explicit is safe)
  if (!session) redirect("/signin");

  return (
    <main className="container max-w-2xl mx-auto px-4 py-8">
      {/* User header */}
      <div className="flex items-center gap-3 mb-8">
        <Avatar>
          <AvatarImage
            src={session.user?.image ?? ""}
            alt={session.user?.name ?? ""}
          />
          <AvatarFallback>
            {session.user?.name?.charAt(0).toUpperCase() ?? "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold">Welcome, {session.user?.name}</h1>
          <p className="text-sm text-muted-foreground">{session.user?.email}</p>
        </div>
      </div>

      {/* Add task card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add a task</CardTitle>
          <CardDescription>What do you need to get done?</CardDescription>
        </CardHeader>
        <CardContent>
          <TodoForm />
        </CardContent>
      </Card>

      {/* Task list */}
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

export const metadata = {
  title: "Dashboard — Todo App",
};
