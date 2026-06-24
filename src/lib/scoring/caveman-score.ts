// src/lib/scoring/caveman-score.ts

import type { FoodAnalysis, NutritionFacts, UserProfileData, Verdict } from "@/types";
import { analyzeIngredients, ingredientRiskScore } from "@/lib/ingredients/flags";
import { getEffectiveTargets } from "@/lib/nutrition/calculator";
import { clamp } from "@/lib/utils";

interface ScoreContext {
  profile: UserProfileData;
  dailyConsumed?: NutritionFacts;
}

function strictnessMultiplier(strictness: UserProfileData["strictness"]): number {
  switch (strictness) {
    case "strict":
      return 1.3;
    case "flexible":
      return 0.7;
    default:
      return 1.0;
  }
}

function scoreCalorieFit(itemCals: number, remaining: number, target: number): number {
  if (target <= 0) return 70;
  if (itemCals <= remaining) return 100 - (itemCals / Math.max(remaining, 1)) * 15;
  const overRatio = (itemCals - remaining) / target;
  return clamp(100 - overRatio * 120, 0, 100);
}

function scoreProteinFit(protein: number, target: number, goal: UserProfileData["healthGoal"]): number {
  const ratio = protein / Math.max(target * 0.25, 1);
  let score = clamp(ratio * 80, 20, 100);
  if (goal === "muscle_gain" && protein >= 20) score = Math.min(100, score + 15);
  if (goal === "fat_loss" && protein >= 15) score = Math.min(100, score + 10);
  return score;
}

function scoreSugar(sugar: number, target: number, goal: UserProfileData["healthGoal"]): number {
  const dailyPortion = target * 0.2;
  if (sugar <= dailyPortion * 0.5) return 100;
  if (sugar <= dailyPortion) return 80;
  const penalty = ((sugar - dailyPortion) / Math.max(dailyPortion, 1)) * 40;
  const base = clamp(80 - penalty, 0, 80);
  return goal === "fat_loss" ? base * 0.9 : base;
}

function scoreSodium(sodium: number, target: number): number {
  const dailyPortion = target * 0.25;
  if (sodium <= dailyPortion * 0.6) return 100;
  if (sodium <= dailyPortion) return 85;
  return clamp(85 - ((sodium - dailyPortion) / Math.max(dailyPortion, 1)) * 50, 0, 85);
}

function scoreFiber(fiber: number): number {
  if (fiber >= 5) return 100;
  if (fiber >= 3) return 85;
  if (fiber >= 1) return 70;
  return 55;
}

function scoreProcessing(flags: { category: string }[]): number {
  const processingCount = flags.filter((f) =>
    ["processing", "preservative", "additive", "artificial_dye"].includes(f.category)
  ).length;
  return clamp(100 - processingCount * 12, 0, 100);
}

function scoreGoalFit(nutrition: NutritionFacts, goal: UserProfileData["healthGoal"]): number {
  switch (goal) {
    case "fat_loss":
      return nutrition.calories <= 400 && (nutrition.sugar ?? 0) <= 15 ? 90 : 65;
    case "muscle_gain":
      return nutrition.protein >= 25 ? 95 : nutrition.protein >= 15 ? 75 : 55;
    case "clean_eating":
      return 75;
    default:
      return 80;
  }
}

export function calculateCavemanScore(analysis: FoodAnalysis, context: ScoreContext): number {
  const targets = getEffectiveTargets(context.profile);
  const consumed = context.dailyConsumed ?? {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  };
  const remaining = {
    calories: Math.max(targets.calories - consumed.calories, 0),
    protein: Math.max(targets.protein - consumed.protein, 0),
    carbs: Math.max(targets.carbs - consumed.carbs, 0),
    fats: Math.max(targets.fats - consumed.fats, 0),
  };

  const flags =
    analysis.ingredientFlags.length > 0
      ? analysis.ingredientFlags
      : analyzeIngredients(analysis.ingredients, context.profile);

  const n = analysis.nutrition;
  const mult = strictnessMultiplier(context.profile.strictness);

  const factors = {
    calorieFit: scoreCalorieFit(n.calories, remaining.calories, targets.calories),
    proteinFit: scoreProteinFit(n.protein, targets.protein, context.profile.healthGoal),
    macroFit: clamp(
      (scoreCalorieFit(n.carbs, remaining.carbs, targets.carbs) +
        scoreCalorieFit(n.fats, remaining.fats, targets.fats)) /
        2,
      0,
      100
    ),
    sugarLoad: scoreSugar(n.sugar ?? 0, targets.sugar, context.profile.healthGoal),
    sodiumLoad: scoreSodium(n.sodium ?? 0, targets.sodium),
    fiberValue: scoreFiber(n.fiber ?? 0),
    ingredientRisk: ingredientRiskScore(flags),
    additiveScore: scoreProcessing(flags),
    processingScore: scoreProcessing(flags),
    goalFit: scoreGoalFit(n, context.profile.healthGoal),
    budgetFit: scoreCalorieFit(n.calories, remaining.calories, targets.calories),
  };

  const weights = {
    calorieFit: 0.15,
    proteinFit: 0.12,
    macroFit: 0.1,
    sugarLoad: 0.12,
    sodiumLoad: 0.1,
    fiberValue: 0.08,
    ingredientRisk: 0.15,
    additiveScore: 0.05,
    processingScore: 0.03,
    goalFit: 0.1,
    budgetFit: 0.1,
  };

  let raw =
    factors.calorieFit * weights.calorieFit +
    factors.proteinFit * weights.proteinFit +
    factors.macroFit * weights.macroFit +
    factors.sugarLoad * weights.sugarLoad +
    factors.sodiumLoad * weights.sodiumLoad +
    factors.fiberValue * weights.fiberValue +
    factors.ingredientRisk * weights.ingredientRisk +
    factors.additiveScore * weights.additiveScore +
    factors.processingScore * weights.processingScore +
    factors.goalFit * weights.goalFit +
    factors.budgetFit * weights.budgetFit;

  if (mult > 1) {
    const penaltyCategories = flags.filter((f) => f.severity !== "low").length;
    raw -= penaltyCategories * 3 * (mult - 1) * 10;
  } else if (mult < 1) {
    raw += 3;
  }

  if (analysis.isEstimated) raw -= (1 - analysis.confidence) * 8;

  return Math.round(clamp(raw, 0, 100));
}

export function scoreToVerdict(
  score: number,
  profile: Pick<UserProfileData, "scoreEatThreshold" | "scoreCautionThreshold">
): Verdict {
  if (score >= profile.scoreEatThreshold) return "eat";
  if (score >= profile.scoreCautionThreshold) return "caution";
  return "avoid";
}
