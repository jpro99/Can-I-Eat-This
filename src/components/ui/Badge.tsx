// src/components/ui/Badge.tsx

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "eat" | "caution" | "avoid";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-neutral-100 text-neutral-700",
    eat: "bg-emerald-100 text-emerald-800",
    caution: "bg-amber-100 text-amber-800",
    avoid: "bg-rose-100 text-rose-800",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
