// src/components/coach/MicronutrientPanel.tsx

"use client";

import { Card } from "@/components/ui/Card";
import type { MicronutrientStatus } from "@/types";
import { cn } from "@/lib/utils";

interface MicronutrientPanelProps {
  status: MicronutrientStatus[];
}

export function MicronutrientPanel({ status }: MicronutrientPanelProps) {
  const depleted = status.filter((s) => s.status !== "good").slice(0, 6);
  if (depleted.length === 0) {
    return (
      <Card className="mb-6">
        <h3 className="font-semibold">Vitamins & minerals</h3>
        <p className="mt-2 text-sm text-neutral-500">Micronutrient targets look good based on today&apos;s logs.</p>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <h3 className="mb-3 font-semibold">Vitamins & minerals — needs attention</h3>
      <div className="space-y-3">
        {depleted.map((item) => (
          <div key={item.key}>
            <div className="flex justify-between text-sm">
              <span className="font-medium">{item.label}</span>
              <span className={cn(item.status === "depleted" ? "text-rose-600" : "text-amber-600")}>
                {item.consumed}{item.unit} / {item.target}{item.unit}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-100">
              <div
                className={cn("h-full rounded-full", item.status === "depleted" ? "bg-rose-400" : "bg-amber-400")}
                style={{ width: `${item.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
