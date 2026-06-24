// src/lib/activity/calculator.ts — MET-based burn (bonus on top of TDEE baseline)

import type { ActivityType } from "@/types";

/** MET values — structured exercise logged as extra burn beyond profile activityLevel */
export const ACTIVITY_MET: Record<ActivityType, number> = {
  walk: 3.8,
  run: 9.8,
  hike: 6.0,
  cycle: 7.5,
  workout: 6.0,
  steps: 3.5,
  other: 5.0,
};

export function caloriesFromMet(met: number, weightKg: number, durationMin: number): number {
  if (durationMin <= 0 || weightKg <= 0) return 0;
  return Math.round(met * weightKg * (durationMin / 60));
}

export function estimateActivityCalories(
  type: ActivityType,
  weightKg: number,
  durationMin: number,
  distanceKm?: number
): number {
  if (distanceKm != null && distanceKm > 0 && durationMin > 0) {
    const speedKmh = distanceKm / (durationMin / 60);
    let met = ACTIVITY_MET[type];
    if (type === "walk" || type === "steps") {
      if (speedKmh >= 6.4) met = 5.0;
      else if (speedKmh >= 5.6) met = 4.3;
      else met = 3.5;
    } else if (type === "run") {
      if (speedKmh >= 12) met = 11.5;
      else if (speedKmh >= 10) met = 9.8;
      else if (speedKmh >= 8) met = 8.3;
      else met = 6.0;
    }
    return caloriesFromMet(met, weightKg, durationMin);
  }
  return caloriesFromMet(ACTIVITY_MET[type], weightKg, durationMin);
}

/** ~0.04 kcal per step per kg body weight (conservative) */
export function caloriesFromSteps(steps: number, weightKg: number): number {
  return Math.round(steps * 0.04 * weightKg);
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function trackDistanceKm(points: { lat: number; lon: number }[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineKm(points[i - 1].lat, points[i - 1].lon, points[i].lat, points[i].lon);
  }
  return Math.round(total * 100) / 100;
}
