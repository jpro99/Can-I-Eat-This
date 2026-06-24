// src/components/food/MacroBar.tsx

import { cn } from "@/lib/utils";

interface MacroBarProps {
  label: string;
  value: number;
  target: number;
  unit?: string;
  color?: string;
}

export function MacroBar({ label, value, target, unit = "", color = "bg-emerald-500" }: MacroBarProps) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  const remaining = Math.max(target - value, 0);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
        <span className="text-neutral-500">
          {Math.round(value)}{unit} / {Math.round(target)}{unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
      </div>
      {remaining > 0 && (
        <p className="text-xs text-neutral-400">{Math.round(remaining)}{unit} remaining</p>
      )}
    </div>
  );
}
