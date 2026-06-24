// src/lib/scoring/decision-engine.ts

import type { DecisionResult, FoodAnalysis, NutritionFacts, UserProfileData } from "@/types";
import { loadDailyCoachContext } from "@/lib/coach/daily-context";
import { evaluateWithCoach } from "@/lib/coach/food-advisor";

interface DecisionContext {
  profile: UserProfileData;
  dailyConsumed?: NutritionFacts;
}

export async function evaluateFoodAsync(analysis: FoodAnalysis): Promise<DecisionResult> {
  const ctx = await loadDailyCoachContext();
  return evaluateWithCoach(analysis, ctx);
}

export function evaluateFood(analysis: FoodAnalysis, context: DecisionContext): DecisionResult {
  return evaluateWithCoach(analysis, {
    profile: context.profile,
    consumed: {
      ...(context.dailyConsumed ?? { calories: 0, protein: 0, carbs: 0, fats: 0 }),
      micronutrients: {},
    },
    targets: {
      calories: context.profile.targetCalories ?? 2000,
      protein: context.profile.targetProtein ?? 150,
      carbs: context.profile.targetCarbs ?? 200,
      fats: context.profile.targetFats ?? 65,
      micronutrients: {},
    },
    remaining: { calories: 0, protein: 0, carbs: 0, fats: 0 },
    waterConsumedMl: 0,
    waterTargetMl: 2500,
    proteinPctOfTarget: 0,
    hoursLeftInDay: 8,
    flagCount: 0,
  });
}
