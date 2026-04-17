// src/app/(auth)/signin/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The sign-in page — shows a "Continue with GitHub" button.
//
// "use client" DIRECTIVE:
// This file uses browser-specific hooks (useSearchParams, onClick handlers),
// so it must be a Client Component. It cannot use async/await at the top level
// or access server-only APIs like getServerSession.
//
// HOW THE SIGN-IN FLOW WORKS:
// 1. User visits /signin (or is redirected here by middleware/auth checks)
// 2. They click "Continue with GitHub"
// 3. signIn("github", { callbackUrl }) triggers the OAuth flow:
//    - Browser redirects to GitHub's /login/oauth/authorize
//    - GitHub shows its own "Authorize App" screen
//    - GitHub redirects back to /api/auth/callback/github with a `code`
//    - NextAuth exchanges `code` for an access token + user profile
//    - A session is created, user is redirected to callbackUrl
// 4. callbackUrl ensures the user lands back where they started.
//    e.g. if they tried to visit /dashboard, after login they go to /dashboard.
//    Default is /dashboard if no callbackUrl is in the query string.

"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";       // client-side sign-in trigger
import { useSearchParams } from "next/navigation"; // read query parameters
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

// We extract the form logic into a separate component so that we can wrap it
// in a <Suspense> boundary below. This is required by Next.js when using
// useSearchParams() in a Client Component during static prerendering.
function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to access your tasks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error === "OAuthAccountNotLinked"
              ? "This email is already registered with a different provider."
              : "Authentication failed. Please try again."}
          </div>
        )}

        <Button
          className="w-full"
          onClick={() => signIn("github", { callbackUrl })}
        >
          <GitHubLogoIcon className="mr-2 h-4 w-4" />
          Continue with GitHub
        </Button>
      </CardContent>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/30">
      <Suspense fallback={<Card className="w-full max-w-sm h-64 animate-pulse bg-muted/50" />}>
        <SignInForm />
      </Suspense>
    </main>
  );
}
