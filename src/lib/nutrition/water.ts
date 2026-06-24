// src/lib/nutrition/water.ts

import type { Supplement, UserProfileData } from "@/types";
import { flOzToMl, kgToLbs, ML_PER_FL_OZ } from "@/lib/units/us";

export function calculateWaterTarget(profile: Pick<UserProfileData, "weightKg" | "activityLevel" | "targetWaterMl" | "supplements">): number {
  if (profile.targetWaterMl) return profile.targetWaterMl;

  // US guideline: half body weight in fl oz per day
  let base = Math.round((kgToLbs(profile.weightKg) / 2) * ML_PER_FL_OZ);
  if (profile.activityLevel === "active" || profile.activityLevel === "very_active") {
    base += flOzToMl(16);
  }

  const takesCreatine = profile.supplements.some(
    (s) => s.active && s.name.toLowerCase().includes("creatine")
  );
  if (takesCreatine) base += flOzToMl(24);

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

/** US water quick-log presets (stored as ml internally) */
export const WATER_PRESETS = [
  { flOz: 8, ml: Math.round(flOzToMl(8)) },
  { flOz: 12, ml: Math.round(flOzToMl(12)) },
  { flOz: 16, ml: Math.round(flOzToMl(16)) },
  { flOz: 24, ml: Math.round(flOzToMl(24)) },
] as const;

export const WATER_PRESETS_ML = WATER_PRESETS.map((p) => p.ml);
