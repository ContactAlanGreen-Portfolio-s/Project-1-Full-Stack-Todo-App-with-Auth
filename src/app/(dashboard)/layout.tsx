// src/app/(dashboard)/layout.tsx
import { ReactNode } from "react";
import { Header } from "@/components/layout/header"; // 1. UNCOMMENT THIS LINE

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header /> {/* 2. UNCOMMENT THIS LINE */}
      <main className="flex-1 bg-muted/10">{children}</main>
    </div>
  );
}
