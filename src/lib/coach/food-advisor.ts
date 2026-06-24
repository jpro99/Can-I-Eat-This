// src/lib/coach/food-advisor.ts

import type { DailyCoachContext, DecisionResult, FoodAnalysis, RestaurantInfo } from "@/types";
import { PROTEIN_RICH_FOODS } from "@/types";
import { restaurantWarnings } from "@/lib/restaurants/knowledge";
import { pickProteinSuggestions } from "@/lib/coach/daily-coach";
import { scoreToVerdict } from "@/lib/scoring/caveman-score";
import { calculateCavemanScore } from "@/lib/scoring/caveman-score";
import { analyzeIngredients } from "@/lib/ingredients/flags";
import { formatWaterFlOz } from "@/lib/units/us";

interface AdvisorInput {
  analysis: FoodAnalysis;
  ctx: DailyCoachContext;
  restaurant?: RestaurantInfo | null;
}

export function buildForYouAdvice(input: AdvisorInput): Pick<DecisionResult, "forYouSummary" | "suggestions" | "reasons" | "positives" | "negatives"> {
  const { analysis, ctx, restaurant } = input;
  const { profile, consumed, targets, remaining, waterConsumedMl, waterTargetMl, proteinPctOfTarget } = ctx;
  const n = analysis.nutrition;
  const name = profile.name.split(" ")[0] || "You";
  const flags = analysis.ingredientFlags.length
    ? analysis.ingredientFlags
    : analyzeIngredients(analysis.ingredients, profile);

  const positives: string[] = [];
  const negatives: string[] = [];
  const suggestions: string[] = [];
  const narrativeParts: string[] = [];

  const proteinAfter = consumed.protein + n.protein * (analysis.servings ?? 1);
  const proteinStillNeeded = Math.max(targets.protein - proteinAfter, 0);
  const lowProteinDay = proteinPctOfTarget < 0.55;
  const waterLow = waterConsumedMl < waterTargetMl * 0.65;
  const creatineActive = profile.supplements.some((s) => s.active && s.name.toLowerCase().includes("creatine"));

  if (lowProteinDay && n.protein < 15) {
    narrativeParts.push(
      `${name}, for you this isn't ideal right now — you've only had ${Math.round(consumed.protein)}g protein today (${Math.round(proteinPctOfTarget * 100)}% of your ${targets.protein}g goal). This item adds just ${Math.round(n.protein * (analysis.servings ?? 1))}g.`
    );
    negatives.push("Low protein relative to what you still need today");
    suggestions.push(...pickProteinSuggestions(3));
    narrativeParts.push(`Better picks for you today: ${PROTEIN_RICH_FOODS.slice(0, 3).join(", ")}.`);
  } else if (n.protein >= 20 && proteinStillNeeded > 0) {
    narrativeParts.push(
      `Good fit for your protein gap — this adds ~${Math.round(n.protein * (analysis.servings ?? 1))}g. You'd have ${Math.round(proteinStillNeeded)}g left after this.`
    );
    positives.push(`Helps close your protein gap (+${Math.round(n.protein * (analysis.servings ?? 1))}g)`);
  }

  if (n.protein >= 15 && !lowProteinDay) {
    positives.push(`Solid protein (${Math.round(n.protein * (analysis.servings ?? 1))}g)`);
  }

  if (waterLow && creatineActive) {
    narrativeParts.push(
      `You're at ${formatWaterFlOz(waterConsumedMl)} water and you take creatine — drink at least 16 fl oz before or with this meal. Extra hydration supports kidney function when supplementing creatine (general wellness guidance).`
    );
    negatives.push("Hydration is low while on creatine");
    suggestions.push("Log 16 fl oz of water now");
  } else if (waterLow) {
    narrativeParts.push(`You're behind on water today (${Math.round((waterConsumedMl / waterTargetMl) * 100)}% of goal). Pair this meal with a full glass.`);
  }

  if (restaurant) {
    const rw = restaurantWarnings(restaurant, profile.avoidGmo);
    negatives.push(...rw.slice(0, 2));
    if (restaurant.tips.length > 0) suggestions.push(restaurant.tips[0]);
    narrativeParts.push(`${restaurant.name}: ${restaurant.notes}`);
  }

  if (analysis.mealContext?.mealOrigin === "homemade") {
    positives.push("Homemade — you control ingredients and portions");
  } else if (analysis.mealContext?.mealOrigin === "restaurant" && !restaurant) {
    narrativeParts.push("Restaurant meal — sodium and portions are often underestimated. Confirm serving size.");
  }

  if ((n.sodium ?? 0) > 600 && (remaining.sodium ?? 0) < 800) {
    narrativeParts.push(`High sodium for what's left in your daily budget (${Math.round(remaining.sodium ?? 0)}mg remaining).`);
    negatives.push("Pushes sodium budget");
  }

  if ((n.sugar ?? 0) > 15 && profile.healthGoal === "fat_loss") {
    negatives.push("Higher sugar for fat-loss goal");
  }

  for (const flag of flags.slice(0, 2)) {
    negatives.push(`${flag.name}: ${flag.whyFlagged.split(".")[0]}`);
  }

  if (analysis.isEstimated) {
    narrativeParts.push(`Portion estimate (${Math.round(analysis.confidence * 100)}% confidence) — tap Edit if this looks off.`);
  }

  if (n.calories > (remaining.calories ?? 0) + 150) {
    narrativeParts.push(`This would put you ~${Math.round(n.calories * (analysis.servings ?? 1) - (remaining.calories ?? 0))} cal over your remaining budget.`);
    negatives.push("Exceeds remaining calories");
  } else if (n.calories <= (remaining.calories ?? 0)) {
    positives.push("Fits remaining calorie budget");
  }

  let forYouSummary: string;
  if (narrativeParts.length > 0) {
    forYouSummary = narrativeParts.join(" ");
  } else if (n.protein >= 20) {
    forYouSummary = `${name}, this looks like a strong fit — good protein and aligned with your goals today.`;
  } else {
    forYouSummary = `${name}, reasonable choice — review portions and ingredients before you commit.`;
  }

  const reasons: string[] = [];
  if (negatives.length > 0) reasons.push(...negatives.slice(0, 3));
  else if (positives.length > 0) reasons.push(...positives.slice(0, 2));

  return { forYouSummary, suggestions: [...new Set(suggestions)].slice(0, 4), reasons, positives, negatives };
}

export function evaluateWithCoach(
  analysis: FoodAnalysis,
  ctx: DailyCoachContext,
  restaurant?: RestaurantInfo | null
): DecisionResult {
  const flags = analysis.ingredientFlags.length
    ? analysis.ingredientFlags
    : analyzeIngredients(analysis.ingredients, ctx.profile);
  const enriched = { ...analysis, ingredientFlags: flags };
  const score = calculateCavemanScore(enriched, {
    profile: ctx.profile,
    dailyConsumed: ctx.consumed,
  });
  const verdict = scoreToVerdict(score, ctx.profile);
  const advice = buildForYouAdvice({ analysis: enriched, ctx, restaurant });

  return {
    score,
    verdict,
    reasons: advice.reasons.length > 0 ? advice.reasons : ["Review fit for your goals"],
    positives: advice.positives,
    negatives: advice.negatives,
    forYouSummary: advice.forYouSummary,
    suggestions: advice.suggestions,
  };
}
