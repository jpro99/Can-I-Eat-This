// src/components/ui/ProgressRing.tsx

"use client";

import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number;
  max: number;
  label: string;
  unit?: string;
  color?: string;
  size?: number;
}

export function ProgressRing({
  value,
  max,
  label,
  unit = "",
  color = "#10b981",
  size = 88,
}: ProgressRingProps) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-neutral-100 dark:text-neutral-800"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold text-neutral-900 dark:text-white">
            {Math.round(value)}
          </span>
          {unit && <span className="text-[10px] text-neutral-500">{unit}</span>}
        </div>
      </div>
      <span className={cn("text-xs font-medium text-neutral-500")}>{label}</span>
    </div>
  );
}
