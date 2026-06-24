// src/components/layout/BottomNav.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Home, Plus, Settings, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/today", icon: Home, label: "Today" },
  { href: "/scan", icon: Plus, label: "Add", primary: true },
  { href: "/history", icon: BarChart3, label: "History" },
  { href: "/reports", icon: Calendar, label: "Reports" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200/80 bg-white/90 pb-safe-bottom backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="mx-auto flex max-w-lg items-end justify-around px-2 py-2">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          if (tab.primary) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="relative -mt-6 flex flex-col items-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg shadow-neutral-900/20 transition-transform active:scale-95 dark:bg-white dark:text-neutral-900">
                  <Icon size={28} strokeWidth={2.5} />
                </div>
                <span className="mt-1 text-[10px] font-medium text-neutral-500">{tab.label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 transition-colors",
                active ? "text-neutral-900 dark:text-white" : "text-neutral-400"
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
