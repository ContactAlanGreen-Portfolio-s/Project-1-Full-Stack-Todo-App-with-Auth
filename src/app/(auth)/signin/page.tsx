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

export default function SignInPage() {
  // useSearchParams() reads the URL's query string (e.g. ?callbackUrl=/dashboard)
  const searchParams = useSearchParams();

  // After signing in, take the user back to where they wanted to go.
  // Default to /dashboard if there's no callbackUrl in the URL.
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  // `error` is set by NextAuth when something goes wrong during OAuth.
  // E.g. ?error=OAuthAccountNotLinked means the email is registered elsewhere.
  const error = searchParams.get("error");

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to access your tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ── Error banner ─────────────────────────────────────────────── */}
          {/* Only shown when `error` query param is present */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {/* Show a friendly message for the most common error case */}
              {error === "OAuthAccountNotLinked"
                ? "This email is already registered with a different provider."
                : "Authentication failed. Please try again."}
            </div>
          )}

          {/* ── GitHub OAuth button ──────────────────────────────────────── */}
          <Button
            className="w-full"
            onClick={() => signIn("github", { callbackUrl })}
            // signIn("github") tells NextAuth to use the GitHub provider.
            // { callbackUrl } tells NextAuth where to redirect after success.
          >
            <GitHubLogoIcon className="mr-2 h-4 w-4" />
            Continue with GitHub
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
