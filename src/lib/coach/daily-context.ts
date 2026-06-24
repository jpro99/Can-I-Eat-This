// src/lib/coach/daily-context.ts

import { getOrCreateProfile, prisma } from "@/lib/db";
import { mapProfile } from "@/lib/profile/mapper";
import { getEffectiveTargets } from "@/lib/nutrition/calculator";
import { sumNutrition, mapMealLog } from "@/lib/nutrition/aggregates";
import {
  getMicronutrientTargets,
  parseMicronutrients,
  sumMicronutrients,
} from "@/lib/nutrition/micronutrients";
import { calculateWaterTarget } from "@/lib/nutrition/water";
import { parseJsonArray, startOfDay, endOfDay } from "@/lib/utils";
import type { DailyCoachContext, UserProfileData } from "@/types";

export async function loadDailyCoachContext(profileOverride?: UserProfileData): Promise<DailyCoachContext> {
  const profile = profileOverride ?? mapProfile(await getOrCreateProfile());
  const now = new Date();
  const targets = getEffectiveTargets(profile);
  const microTargets = getMicronutrientTargets(profile);

  const logs = await prisma.mealLog.findMany({
    where: {
      profileId: profile.id,
      timestamp: { gte: startOfDay(now), lte: endOfDay(now) },
    },
  });

  const waterLogs = await prisma.waterLog.findMany({
    where: {
      profileId: profile.id,
      recordedAt: { gte: startOfDay(now), lte: endOfDay(now) },
    },
  });

  const consumed = sumNutrition(logs);
  const microConsumed = sumMicronutrients(logs.map((l) => parseMicronutrients(l.micronutrients)));
  const waterConsumedMl = waterLogs.reduce((acc, w) => acc + w.amountMl, 0);
  const waterTargetMl = calculateWaterTarget(profile);
  const flagCount = logs.reduce((acc, l) => acc + parseJsonArray(l.ingredientFlags).length, 0);

  const endOfDayDate = endOfDay(now);
  const hoursLeftInDay = Math.max((endOfDayDate.getTime() - now.getTime()) / (1000 * 60 * 60), 0);

  return {
    profile,
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
    waterConsumedMl,
    waterTargetMl,
    proteinPctOfTarget: targets.protein > 0 ? consumed.protein / targets.protein : 0,
    hoursLeftInDay,
    flagCount,
    mealsLoggedCount: logs.length,
  };
}

export { mapMealLog };
