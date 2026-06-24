// src/lib/nutrition/water.ts

import type { Supplement, UserProfileData } from "@/types";

export function calculateWaterTarget(profile: Pick<UserProfileData, "weightKg" | "activityLevel" | "targetWaterMl" | "supplements">): number {
  if (profile.targetWaterMl) return profile.targetWaterMl;

  let base = Math.round(profile.weightKg * 35);
  if (profile.activityLevel === "active" || profile.activityLevel === "very_active") {
    base += 500;
  }

  const takesCreatine = profile.supplements.some(
    (s) => s.active && s.name.toLowerCase().includes("creatine")
  );
  if (takesCreatine) base += 750;

  return base;
}

export function getCreatineSupplement(supplements: Supplement[]): Supplement | undefined {
  return supplements.find((s) => s.active && s.name.toLowerCase().includes("creatine"));
}

export function waterStatus(consumedMl: number, targetMl: number) {
  const pct = targetMl > 0 ? consumedMl / targetMl : 0;
  if (pct >= 0.9) return "good" as const;
  if (pct >= 0.6) return "low" as const;
  return "depleted" as const;
}

export const WATER_PRESETS_ML = [250, 500, 750, 1000];
