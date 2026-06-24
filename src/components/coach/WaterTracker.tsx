// src/components/coach/WaterTracker.tsx

"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatWaterFlOz } from "@/lib/units/us";
import { getDefaultVessel } from "@/lib/water/vessels";
import { getVesselPhoto } from "@/lib/water/vessel-photos";
import type { WaterVessel } from "@/types";
import { Droplets } from "lucide-react";

interface WaterTrackerProps {
  consumedMl: number;
  targetMl: number;
  vessels?: WaterVessel[];
  defaultVesselId?: string | null;
  onOpenLog: () => void;
}

export function WaterTracker({ consumedMl, targetMl, vessels = [], defaultVesselId, onOpenLog }: WaterTrackerProps) {
  const pct = targetMl > 0 ? Math.min((consumedMl / targetMl) * 100, 100) : 0;
  const cup = getDefaultVessel(vessels, defaultVesselId);
  const cupPhoto = cup ? getVesselPhoto(cup.id) : null;

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold">Water</h3>
        </div>
        <span className="text-sm text-neutral-500">
          {formatWaterFlOz(consumedMl)} / {formatWaterFlOz(targetMl)}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
      </div>

      {cup?.photoSetupComplete ? (
        <button
          type="button"
          onClick={onOpenLog}
          className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 p-3 text-left active:scale-[0.99]"
        >
          {cupPhoto ? (
            <img src={cupPhoto} alt="" className="h-12 w-12 rounded-xl object-cover" />
          ) : (
            <span className="text-2xl">🥤</span>
          )}
          <div className="flex-1">
            <p className="font-medium text-blue-950">Same cup?</p>
            <p className="text-sm text-blue-800/80">
              {cup.name} · {cup.volumeFlOz} fl oz — tap to log ×1, ×2, ×3…
            </p>
          </div>
        </button>
      ) : (
        <Button className="mt-4 w-full" variant="secondary" onClick={onOpenLog}>
          <Droplets size={18} />
          Log water — photograph your cup first
        </Button>
      )}
    </Card>
  );
}
