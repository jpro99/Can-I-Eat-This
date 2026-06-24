// src/lib/nutrition/aggregates.ts

import type { MealLog } from "@prisma/client";
import type { HistorySummary, MealLogItem, NutritionFacts } from "@/types";
import { parseJsonArray } from "@/lib/utils";
import { parseMicronutrients } from "@/lib/nutrition/micronutrients";

export function sumNutrition(logs: Pick<
  MealLog,
  "calories" | "protein" | "carbs" | "fats" | "saturatedFat" | "sugar" | "addedSugar" | "fiber" | "sodium" | "cholesterol"
>[]): NutritionFacts {
  return logs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.protein,
      carbs: acc.carbs + log.carbs,
      fats: acc.fats + log.fats,
      saturatedFat: (acc.saturatedFat ?? 0) + log.saturatedFat,
      sugar: (acc.sugar ?? 0) + log.sugar,
      addedSugar: (acc.addedSugar ?? 0) + log.addedSugar,
      fiber: (acc.fiber ?? 0) + log.fiber,
      sodium: (acc.sodium ?? 0) + log.sodium,
      cholesterol: (acc.cholesterol ?? 0) + log.cholesterol,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0, saturatedFat: 0, sugar: 0, addedSugar: 0, fiber: 0, sodium: 0, cholesterol: 0 }
  );
}

export function mapMealLog(log: MealLog): MealLogItem {
  return {
    id: log.id,
    timestamp: log.timestamp.toISOString(),
    mealType: log.mealType as MealLogItem["mealType"],
    mealOrigin: log.mealOrigin as MealLogItem["mealOrigin"],
    restaurantName: log.restaurantName,
    sourceType: log.sourceType as MealLogItem["sourceType"],
    foodName: log.foodName,
    brand: log.brand,
    servings: log.servings,
    servingSize: log.servingSize,
    photoUrl: log.photoUrl,
    confidence: log.confidence,
    isEstimated: log.isEstimated,
    calories: log.calories,
    protein: log.protein,
    carbs: log.carbs,
    fats: log.fats,
    saturatedFat: log.saturatedFat,
    sugar: log.sugar,
    addedSugar: log.addedSugar,
    fiber: log.fiber,
    sodium: log.sodium,
    cholesterol: log.cholesterol,
    micronutrients: parseMicronutrients(log.micronutrients),
    ingredients: log.ingredients,
    ingredientFlags: parseJsonArray(log.ingredientFlags),
    decisionScore: log.decisionScore,
    decisionVerdict: log.decisionVerdict as MealLogItem["decisionVerdict"],
    decisionReasons: parseJsonArray(log.decisionReasons),
    forYouSummary: log.forYouSummary,
  };
}

export function buildHistorySummary(
  logs: MealLog[],
  startDate: Date,
  endDate: Date,
  weightTrend: { date: string; weightKg: number }[] = []
): HistorySummary {
  const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const totals = sumNutrition(logs);
  const foodCounts = new Map<string, number>();
  const greenCounts = new Map<string, number>();
  const redCounts = new Map<string, number>();
  const dailyMap = new Map<string, { calories: number; protein: number; sugar: number; sodium: number; fiber: number; flags: number }>();

  for (const log of logs) {
    foodCounts.set(log.foodName, (foodCounts.get(log.foodName) ?? 0) + 1);
    if (log.decisionVerdict === "eat") greenCounts.set(log.foodName, (greenCounts.get(log.foodName) ?? 0) + 1);
    if (log.decisionVerdict === "avoid") redCounts.set(log.foodName, (redCounts.get(log.foodName) ?? 0) + 1);

    const dateKey = log.timestamp.toISOString().slice(0, 10);
    const existing = dailyMap.get(dateKey) ?? { calories: 0, protein: 0, sugar: 0, sodium: 0, fiber: 0, flags: 0 };
    const flags = parseJsonArray(log.ingredientFlags);
    dailyMap.set(dateKey, {
      calories: existing.calories + log.calories,
      protein: existing.protein + log.protein,
      sugar: existing.sugar + log.sugar,
      sodium: existing.sodium + log.sodium,
      fiber: existing.fiber + log.fiber,
      flags: existing.flags + flags.length,
    });
  }

  const topFoods = [...foodCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const greenFoods = [...greenCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const redFoods = [...redCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const dailyTrends = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  const flagCount = logs.reduce((acc, log) => acc + parseJsonArray(log.ingredientFlags).length, 0);

  return {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
    totalCalories: totals.calories,
    avgCalories: totals.calories / days,
    totalProtein: totals.protein,
    avgProtein: totals.protein / days,
    avgCarbs: totals.carbs / days,
    avgFats: totals.fats / days,
    avgSugar: (totals.sugar ?? 0) / days,
    avgSodium: (totals.sodium ?? 0) / days,
    avgFiber: (totals.fiber ?? 0) / days,
    flagCount,
    topFoods,
    greenFoods,
    redFoods,
    dailyTrends,
    weightTrend,
  };
}
