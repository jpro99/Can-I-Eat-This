// src/lib/coach/daily-coach.ts

import {
  buildMicronutrientStatus,
  foodSuggestionsForDepletion,
  getDepletedNutrients,
} from "@/lib/nutrition/micronutrients";
import { getCreatineSupplement, waterStatus } from "@/lib/nutrition/water";
import type { CoachInsight, DailyCoachContext } from "@/types";
import { PROTEIN_RICH_FOODS } from "@/types";

export function generateDailyInsights(ctx: DailyCoachContext): CoachInsight[] {
  const insights: CoachInsight[] = [];
  const { profile, consumed, targets, remaining, waterConsumedMl, waterTargetMl, proteinPctOfTarget, hoursLeftInDay } = ctx;
  const name = profile.name.split(" ")[0] || "You";

  const proteinGap = remaining.protein ?? 0;
  const microStatus = buildMicronutrientStatus(
    consumed.micronutrients ?? {},
    targets.micronutrients ?? {}
  );
  const depleted = getDepletedNutrients(microStatus);
  const creatine = getCreatineSupplement(profile.supplements);
  const water = waterStatus(waterConsumedMl, waterTargetMl);

  if (proteinPctOfTarget < 0.5 && hoursLeftInDay > 4) {
    insights.push({
      id: "protein-behind",
      severity: "warning",
      title: `${name}, you're behind on protein`,
      body: `You've had ${Math.round(consumed.protein)}g of ${targets.protein}g protein today (${Math.round(proteinPctOfTarget * 100)}%). You still need about ${Math.round(proteinGap)}g.`,
      action: `Look for: ${PROTEIN_RICH_FOODS.slice(0, 3).join(", ")}`,
    });
  } else if (proteinPctOfTarget >= 0.9) {
    insights.push({
      id: "protein-good",
      severity: "success",
      title: "Protein target nearly hit",
      body: `Great work — ${Math.round(consumed.protein)}g protein today. Only ${Math.round(proteinGap)}g to go.`,
    });
  }

  if (water === "depleted") {
    insights.push({
      id: "water-critical",
      severity: "critical",
      title: "You haven't had enough water today",
      body: `${Math.round(waterConsumedMl / 1000 * 10) / 10}L of ${Math.round(waterTargetMl / 1000 * 10) / 10}L goal. Dehydration affects energy, recovery, and appetite.`,
      action: "Log a glass of water now (+250ml)",
    });
  } else if (water === "low") {
    insights.push({
      id: "water-low",
      severity: "warning",
      title: "Water intake is low",
      body: `${Math.round((waterConsumedMl / waterTargetMl) * 100)}% of your daily water goal. Keep sipping.`,
    });
  }

  if (creatine && water !== "good") {
    insights.push({
      id: "creatine-hydration",
      severity: "critical",
      title: "Creatine + low water — prioritize hydration",
      body: "You're taking creatine today but you're behind on water. Creatine pulls water into muscles — without enough fluids, some people report cramping or kidney strain. This is general wellness guidance, not a diagnosis.",
      action: `Aim for ${Math.round(waterTargetMl / 1000 * 10) / 10}L total today. Drink 500ml before your next meal.`,
    });
  }

  if (depleted.length > 0) {
    const foodTips = foodSuggestionsForDepletion(depleted);
    insights.push({
      id: "micro-depleted",
      severity: "warning",
      title: `Running low on ${depleted.map((d) => d.label).join(", ")}`,
      body: `Based on today's logged foods, you may be under target on key micronutrients.`,
      action: foodTips.join(" · "),
    });
  }

  if ((consumed.sodium ?? 0) > (targets.sodium ?? 2300) * 0.85) {
    insights.push({
      id: "sodium-high",
      severity: "warning",
      title: "Sodium is stacking up",
      body: `${Math.round(consumed.sodium ?? 0)}mg of ${targets.sodium}mg today. Choose lower-salt options for the rest of the day.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "on-track",
      severity: "success",
      title: "You're on track today",
      body: `${Math.round(consumed.calories)} cal · ${Math.round(consumed.protein)}g protein · ${Math.round(waterConsumedMl / 1000 * 10) / 10}L water. Keep logging for sharper insights.`,
    });
  }

  return insights;
}

export function pickProteinSuggestions(count = 4): string[] {
  return PROTEIN_RICH_FOODS.slice(0, count);
}
