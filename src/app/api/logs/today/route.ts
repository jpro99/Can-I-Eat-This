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
import { parseJsonArray, startOfDay, endOfDay } from "@/lib/utils";

export async function GET() {
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

  const consumed = sumNutrition(logs);
  const microConsumed = sumMicronutrients(logs.map((l) => parseMicronutrients(l.micronutrients)));
  const flagCount = logs.reduce((acc, l) => acc + parseJsonArray(l.ingredientFlags).length, 0);
  const micronutrientStatus = buildMicronutrientStatus(microConsumed, microTargets);
  const insights = generateDailyInsights(ctx);

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
    waterConsumedMl: ctx.waterConsumedMl,
    waterTargetMl: calculateWaterTarget(profile),
    flagCount,
    meals: logs.map(mapMealLog),
    insights,
    micronutrientStatus,
  });
}
