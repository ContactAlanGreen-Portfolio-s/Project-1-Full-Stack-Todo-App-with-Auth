"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Click below to sign in with your GitHub account
          </p>
        </div>

        <Button
          variant="outline"
          type="button"
          onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
          className="flex items-center gap-2"
        >
          <GitHubLogoIcon className="h-4 w-4" />
          Continue with GitHub
        </Button>
      </div>
    </div>
  );
}
