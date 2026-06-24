// src/components/coach/WaterTracker.tsx

"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { WATER_PRESETS_ML } from "@/lib/nutrition/water";
import { Droplets } from "lucide-react";

interface WaterTrackerProps {
  consumedMl: number;
  targetMl: number;
  onLog: (amountMl: number) => void;
}

export function WaterTracker({ consumedMl, targetMl, onLog }: WaterTrackerProps) {
  const pct = targetMl > 0 ? Math.min((consumedMl / targetMl) * 100, 100) : 0;

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold">Water</h3>
        </div>
        <span className="text-sm text-neutral-500">
          {(consumedMl / 1000).toFixed(1)}L / {(targetMl / 1000).toFixed(1)}L
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {WATER_PRESETS_ML.map((ml) => (
          <Button key={ml} variant="secondary" size="sm" onClick={() => onLog(ml)}>
            +{ml}ml
          </Button>
        ))}
      </div>
    </Card>
  );
}
