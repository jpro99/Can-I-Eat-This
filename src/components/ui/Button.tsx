// src/components/ui/Button.tsx

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-neutral-900 text-white hover:bg-neutral-800 active:scale-[0.98]",
      secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:scale-[0.98]",
      ghost: "bg-transparent text-neutral-700 hover:bg-neutral-100",
      danger: "bg-rose-600 text-white hover:bg-rose-700",
    };
    const sizes = {
      sm: "h-9 px-4 text-sm rounded-xl",
      md: "h-11 px-5 text-base rounded-2xl",
      lg: "h-13 px-6 text-lg rounded-2xl",
      xl: "h-16 px-8 text-lg rounded-3xl font-medium",
    };
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
