// src/lib/activity/presets.ts

import type { ActivityType } from "@/types";

export interface ActivityQuickPreset {
  id: string;
  label: string;
  activityType: ActivityType;
  durationMin: number;
  distanceKm?: number;
  emoji: string;
}

export const ACTIVITY_QUICK_PRESETS: ActivityQuickPreset[] = [
  { id: "walk-15", label: "15 min walk", activityType: "walk", durationMin: 15, emoji: "🚶" },
  { id: "walk-30", label: "30 min walk", activityType: "walk", durationMin: 30, emoji: "🚶" },
  { id: "walk-45", label: "45 min walk", activityType: "walk", durationMin: 45, emoji: "🚶" },
  { id: "run-20", label: "20 min run", activityType: "run", durationMin: 20, emoji: "🏃" },
  { id: "run-30", label: "30 min run", activityType: "run", durationMin: 30, emoji: "🏃" },
  { id: "run-3mi", label: "3 mile run", activityType: "run", durationMin: 30, distanceKm: 4.83, emoji: "🏃" },
  { id: "hike-60", label: "1 hr hike", activityType: "hike", durationMin: 60, emoji: "🥾" },
  { id: "cycle-30", label: "30 min bike", activityType: "cycle", durationMin: 30, emoji: "🚴" },
  { id: "workout-45", label: "45 min workout", activityType: "workout", durationMin: 45, emoji: "💪" },
];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  walk: "Walk",
  run: "Run",
  hike: "Hike",
  cycle: "Cycle",
  workout: "Workout",
  steps: "Steps",
  other: "Activity",
};
