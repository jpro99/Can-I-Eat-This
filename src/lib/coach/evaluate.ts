// src/lib/coach/evaluate.ts

import type { FoodAnalysis, MealContext } from "@/types";
import { loadDailyCoachContext } from "@/lib/coach/daily-context";
import { evaluateWithCoach } from "@/lib/coach/food-advisor";
import { findRestaurant, applyRestaurantAdjustments } from "@/lib/restaurants/knowledge";
import { estimateMicronutrientsFromFood } from "@/lib/nutrition/micronutrients";
import { originConfidenceBoost } from "@/lib/nutrition/portions";
import { analyzeIngredients } from "@/lib/ingredients/flags";
import { prisma } from "@/lib/db";

export async function evaluateAnalysis(analysis: FoodAnalysis, mealContext?: MealContext) {
  const ctx = await loadDailyCoachContext();
  const mergedContext = { ...analysis.mealContext, ...mealContext };
  let enriched: FoodAnalysis = { ...analysis, mealContext: mergedContext };

  let restaurant = null;
  if (mergedContext.restaurantName) {
    const dbRows = await prisma.restaurantKnowledge.findMany({ take: 50 });
    const dbRestaurants = dbRows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      sodiumLevel: r.sodiumLevel as "moderate",
      gmoRisk: r.gmoRisk as "moderate",
      processingLevel: r.processingLevel as "moderate",
      notes: r.notes,
      tips: JSON.parse(r.tips || "[]") as string[],
    }));
    restaurant = findRestaurant(mergedContext.restaurantName, dbRestaurants);
  }

  if (restaurant) {
    enriched = {
      ...enriched,
      nutrition: {
        ...enriched.nutrition,
        ...applyRestaurantAdjustments(enriched.nutrition, restaurant),
      },
    };
  }

  if (!enriched.nutrition.micronutrients || Object.keys(enriched.nutrition.micronutrients).length === 0) {
    enriched.nutrition.micronutrients = estimateMicronutrientsFromFood(enriched.foodName, enriched.nutrition);
  }

  const boost = originConfidenceBoost(mergedContext.mealOrigin);
  enriched.confidence = Math.min(1, Math.max(0.2, enriched.confidence + boost));
  enriched.ingredientFlags = analyzeIngredients(enriched.ingredients, ctx.profile);

  const decision = evaluateWithCoach(enriched, ctx, restaurant);
  return { analysis: enriched, decision, restaurant, dailyContext: ctx };
}
