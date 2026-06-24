// src/lib/coach/daily-coach.ts

import {
  buildMicronutrientStatus,
  foodSuggestionsForDepletion,
  getDepletedNutrients,
} from "@/lib/nutrition/micronutrients";
import { getCreatineSupplement, waterStatus } from "@/lib/nutrition/water";
import type { CoachInsight, DailyCoachContext } from "@/types";
import { PROTEIN_RICH_FOODS } from "@/types";
import { formatWaterFlOz, GLASS_FL_OZ } from "@/lib/units/us";
import { getGreeting } from "@/lib/utils";

export function generateDailyInsights(ctx: DailyCoachContext): CoachInsight[] {
  const insights: CoachInsight[] = [];
  const {
    profile,
    consumed,
    targets,
    remaining,
    waterConsumedMl,
    waterTargetMl,
    proteinPctOfTarget,
    hoursLeftInDay,
    mealsLoggedCount,
  } = ctx;
  const name = profile.name.split(" ")[0] || "You";
  const hour = new Date().getHours();
  const isMorning = hour < 12;
  const isDayStart = mealsLoggedCount === 0 && waterConsumedMl === 0;

  if (isDayStart) {
    insights.push({
      id: "day-start",
      severity: "info",
      title: `${getGreeting()}, ${name} — let's start`,
      body: isMorning
        ? "What have you had to drink or eat so far today? Tap your coffee below, log water, or scan something new."
        : "What have you had today? Log a quick item or scan your next meal to get started.",
    });
    return insights;
  }

  const proteinGap = remaining.protein ?? 0;
  const microStatus = buildMicronutrientStatus(
    consumed.micronutrients ?? {},
    targets.micronutrients ?? {}
  );
  const depleted = getDepletedNutrients(microStatus);
  const creatine = getCreatineSupplement(profile.supplements);
  const water = waterStatus(waterConsumedMl, waterTargetMl);
  const canNagWater = hour >= 10 || mealsLoggedCount > 0;

  if (mealsLoggedCount > 0 && proteinPctOfTarget < 0.5 && hoursLeftInDay > 4) {
    insights.push({
      id: "protein-behind",
      severity: "warning",
      title: `${name}, you're behind on protein`,
      body: `You've had ${Math.round(consumed.protein)}g of ${targets.protein}g protein today (${Math.round(proteinPctOfTarget * 100)}%). You still need about ${Math.round(proteinGap)}g.`,
      action: `Look for: ${PROTEIN_RICH_FOODS.slice(0, 3).join(", ")}`,
    });
  } else if (proteinPctOfTarget >= 0.9 && mealsLoggedCount > 0) {
    insights.push({
      id: "protein-good",
      severity: "success",
      title: "Protein target nearly hit",
      body: `Great work — ${Math.round(consumed.protein)}g protein today. Only ${Math.round(proteinGap)}g to go.`,
    });
  }

  if (canNagWater && water === "depleted") {
    insights.push({
      id: "water-critical",
      severity: "warning",
      title: "Water is a little low",
      body: `${formatWaterFlOz(waterConsumedMl)} of ${formatWaterFlOz(waterTargetMl)} so far. Log what you've had to drink when you get a chance.`,
      action: `Log a glass of water (+${GLASS_FL_OZ} fl oz)`,
    });
  } else if (canNagWater && water === "low") {
    insights.push({
      id: "water-low",
      severity: "info",
      title: "Keep sipping",
      body: `${Math.round((waterConsumedMl / waterTargetMl) * 100)}% of your water goal — you're doing fine, just keep it up.`,
    });
  }

  if (creatine && canNagWater && water !== "good") {
    insights.push({
      id: "creatine-hydration",
      severity: "warning",
      title: "Creatine + hydration",
      body: "You're on creatine today — extra water helps. General wellness tip, not medical advice.",
      action: `Aim for ${formatWaterFlOz(waterTargetMl)} total today.`,
    });
  }

  if (mealsLoggedCount > 0 && depleted.length > 0) {
    const foodTips = foodSuggestionsForDepletion(depleted);
    insights.push({
      id: "micro-depleted",
      severity: "warning",
      title: `Running low on ${depleted.map((d) => d.label).join(", ")}`,
      body: `Based on today's logged foods, you may be under target on key micronutrients.`,
      action: foodTips.join(" · "),
    });
  }

  if (mealsLoggedCount > 0 && (consumed.sodium ?? 0) > (targets.sodium ?? 2300) * 0.85) {
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
      title: mealsLoggedCount === 0 ? `${getGreeting()}, ${name}` : "You're on track today",
      body:
        mealsLoggedCount === 0
          ? "Ready when you are — log coffee, water, or your first meal."
          : `${Math.round(consumed.calories)} cal · ${Math.round(consumed.protein)}g protein · ${formatWaterFlOz(waterConsumedMl)} water. Keep logging for sharper insights.`,
    });
  }

  return insights;
}

export function pickProteinSuggestions(count = 4): string[] {
  return PROTEIN_RICH_FOODS.slice(0, count);
}
