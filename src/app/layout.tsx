// src/app/layout.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Root Layout — wraps the entire application in global providers.
//
// "use client" — required because SessionProvider and QueryClientProvider
// rely on React Context, which is a browser-only feature. The Next.js
// convention is often to split providers into a separate client component,
// but for simplicity, the root layout can be a client component itself.
//
// PROVIDERS EXPLAINED:
// • SessionProvider: Lets any client component call useSession()
// • QueryClientProvider: Powers the useTodos() and useCreateTodo() hooks
// • Toaster: Global popup notifications (e.g. "Task saved!")
"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { makeQueryClient } from "@/lib/query-client";
import { Toaster } from "@/components/ui/sonner";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // useState ensures we don't recreate the client on every render
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <QueryClientProvider client={queryClient}>
            {children}
            <Toaster />
            {process.env.NODE_ENV === "development" && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </QueryClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
