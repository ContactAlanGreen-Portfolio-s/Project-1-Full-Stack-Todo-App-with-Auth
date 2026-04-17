// src/app/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The landing page of the application (e.g., https://yourapp.com/).
//
// This is a Server Component. It checks if the user is already logged in
// BEFORE returning any HTML. If they are, it instantly redirects to /dashboard.
// If not, it shows the marketing copy and a "Get started" button.
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // If already logged in, go straight to dashboard
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl font-bold tracking-tight mb-3">
        Stay organised, ship faster.
      </h1>
      <p className="text-muted-foreground text-lg mb-8 max-w-md">
        A clean task manager for developers. Simple, fast, and yours.
      </p>
      <Button asChild size="lg">
        <Link href="/signin">Get started for free</Link>
      </Button>
    </main>
  );
}
