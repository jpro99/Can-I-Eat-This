// src/app/api/logs/today/route.ts

import { NextResponse } from "next/server";
import { getOrCreateProfile, prisma } from "@/lib/db";
import { mapProfile } from "@/lib/profile/mapper";
import { getEffectiveTargets } from "@/lib/nutrition/calculator";
import { mapMealLog, sumNutrition } from "@/lib/nutrition/aggregates";
import {
  buildMicronutrientStatus,
  getMicronutrientTargets,
  parseMicronutrients,
  sumMicronutrients,
} from "@/lib/nutrition/micronutrients";
import { calculateWaterTarget } from "@/lib/nutrition/water";
import { loadDailyCoachContext } from "@/lib/coach/daily-context";
import { generateDailyInsights } from "@/lib/coach/daily-coach";
import { generateKitchenPredictions } from "@/lib/kitchen/predictions";
import { ACTIVITY_TYPE_LABELS } from "@/lib/activity/presets";
import type { ActivityType } from "@/types";
import { parseJsonArray, startOfDay, endOfDay } from "@/lib/utils";

export async function GET() {
  try {
  const profile = mapProfile(await getOrCreateProfile());
  const targets = getEffectiveTargets(profile);
  const microTargets = getMicronutrientTargets(profile);
  const now = new Date();
  const ctx = await loadDailyCoachContext(profile);

  const logs = await prisma.mealLog.findMany({
    where: {
      profileId: profile.id,
      timestamp: { gte: startOfDay(now), lte: endOfDay(now) },
    },
    orderBy: { timestamp: "desc" },
  });

  const activityRows = await prisma.activityLog.findMany({
    where: {
      profileId: profile.id,
      recordedAt: { gte: startOfDay(now), lte: endOfDay(now) },
    },
    orderBy: { recordedAt: "desc" },
  }).catch(() => [] as Awaited<ReturnType<typeof prisma.activityLog.findMany>>);

  const caloriesBurned = Math.round(activityRows.reduce((s, l) => s + l.caloriesBurned, 0));
  const activities = activityRows.map((log) => ({
    id: log.id,
    activityType: log.activityType as ActivityType,
    label: ACTIVITY_TYPE_LABELS[log.activityType as ActivityType] ?? log.activityType,
    durationMin: log.durationMin,
    distanceKm: log.distanceKm ?? undefined,
    steps: log.steps ?? undefined,
    caloriesBurned: Math.round(log.caloriesBurned),
    source: log.source as "manual" | "gps" | "steps",
    notes: log.notes ?? undefined,
    recordedAt: log.recordedAt.toISOString(),
  }));

  const consumed = sumNutrition(logs);
  const microConsumed = sumMicronutrients(logs.map((l) => parseMicronutrients(l.micronutrients)));
  const flagCount = logs.reduce((acc, l) => acc + parseJsonArray(l.ingredientFlags).length, 0);
  const micronutrientStatus = buildMicronutrientStatus(microConsumed, microTargets);
  const insights = generateDailyInsights(ctx);
  const kitchenPredictions = generateKitchenPredictions(
    profile.kitchenMemory,
    profile.dailyRoutines,
    logs.map(mapMealLog)
  );

  const netCalories = Math.round(consumed.calories - caloriesBurned);
  const effectiveRemainingCalories = targets.calories + caloriesBurned - consumed.calories;

  return NextResponse.json({
    date: now.toISOString().slice(0, 10),
    consumed: { ...consumed, micronutrients: microConsumed },
    targets: {
      calories: targets.calories,
      protein: targets.protein,
      carbs: targets.carbs,
      fats: targets.fats,
      fiber: targets.fiber,
      sodium: targets.sodium,
      sugar: targets.sugar,
      micronutrients: microTargets,
    },
    remaining: {
      calories: Math.max(targets.calories - consumed.calories, 0),
      protein: Math.max(targets.protein - consumed.protein, 0),
      carbs: Math.max(targets.carbs - consumed.carbs, 0),
      fats: Math.max(targets.fats - consumed.fats, 0),
      fiber: Math.max((targets.fiber ?? 0) - (consumed.fiber ?? 0), 0),
      sodium: Math.max((targets.sodium ?? 0) - (consumed.sodium ?? 0), 0),
      sugar: Math.max((targets.sugar ?? 0) - (consumed.sugar ?? 0), 0),
    },
    caloriesBurned,
    netCalories,
    effectiveRemainingCalories,
    activities,
    waterConsumedMl: ctx.waterConsumedMl,
    waterTargetMl: calculateWaterTarget(profile),
    flagCount,
    meals: logs.map(mapMealLog),
    insights,
    micronutrientStatus,
    kitchenPredictions,
  });
  } catch (error) {
    console.error("[logs/today GET]", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error:
          msg.includes("kitchenMemory") || msg.includes("column")
            ? "Database schema is out of date. Run: npm run db:push"
            : "Failed to load today summary",
      },
      { status: 500 }
    );
  }
}
