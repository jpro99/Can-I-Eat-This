// src/components/layout/AppShell.tsx

"use client";

import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  hideNav?: boolean;
  className?: string;
}

export function AppShell({ children, hideNav, className }: AppShellProps) {
  return (
    <div className="min-h-[100dvh] bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <main className={cn("mx-auto max-w-lg px-4 pb-28 pt-safe-top", className)}>{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
