// src/components/coach/CoachInsights.tsx

"use client";

import { Card } from "@/components/ui/Card";
import type { CoachInsight } from "@/types";
import { AlertTriangle, CheckCircle2, Droplets, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface CoachInsightsProps {
  insights: CoachInsight[];
  onLogWater?: () => void;
}

export function CoachInsights({ insights, onLogWater }: CoachInsightsProps) {
  if (insights.length === 0) return null;

  return (
    <div className="mb-6 space-y-3">
      <h2 className="text-lg font-semibold">For you today</h2>
      {insights.map((insight) => {
        const Icon =
          insight.severity === "critical"
            ? AlertTriangle
            : insight.severity === "success"
              ? CheckCircle2
              : insight.severity === "warning"
                ? Droplets
                : Info;
        const bg =
          insight.severity === "critical"
            ? "border-rose-200 bg-rose-50"
            : insight.severity === "success"
              ? "border-emerald-200 bg-emerald-50"
              : insight.severity === "warning"
                ? "border-amber-200 bg-amber-50"
                : "border-neutral-200 bg-white";

        return (
          <Card key={insight.id} className={cn(bg)}>
            <div className="flex gap-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-neutral-700" />
              <div>
                <h3 className="font-semibold">{insight.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">{insight.body}</p>
                {insight.action && (
                  <button
                    type="button"
                    onClick={insight.id.includes("water") ? onLogWater : undefined}
                    className="mt-2 text-sm font-medium text-neutral-900 underline-offset-2 hover:underline"
                  >
                    {insight.action}
                  </button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
