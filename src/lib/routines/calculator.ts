// src/lib/routines/calculator.ts

import type { DailyRoutine, NutritionFacts, RoutineModifier } from "@/types";

export function modifierUnits(level: number, modifier: RoutineModifier): number {
  const pct = Math.max(0, Math.min(level, 100)) / 100;
  return Math.round(modifier.maxUnits * pct * 10) / 10;
}

export function nutritionFromModifier(modifier: RoutineModifier, level: number): NutritionFacts {
  const units = modifierUnits(level, modifier);
  return {
    calories: Math.round(modifier.caloriesPerUnit * units),
    protein: Math.round(modifier.proteinPerUnit * units * 10) / 10,
    carbs: Math.round(modifier.carbsPerUnit * units * 10) / 10,
    fats: Math.round(modifier.fatsPerUnit * units * 10) / 10,
    sugar: Math.round((modifier.sugarPerUnit ?? 0) * units * 10) / 10,
    sodium: Math.round((modifier.sodiumPerUnit ?? 0) * units),
  };
}

export function calculateRoutineNutrition(
  routine: DailyRoutine,
  levels: Record<string, number>
): NutritionFacts {
  const total: NutritionFacts = { ...routine.base };

  for (const mod of routine.modifiers) {
    const level = levels[mod.id] ?? routine.defaults[mod.id] ?? 0;
    const part = nutritionFromModifier(mod, level);
    total.calories += part.calories;
    total.protein += part.protein;
    total.carbs += part.carbs;
    total.fats += part.fats;
    total.sugar = (total.sugar ?? 0) + (part.sugar ?? 0);
    total.sodium = (total.sodium ?? 0) + (part.sodium ?? 0);
    total.fiber = (total.fiber ?? 0) + (part.fiber ?? 0);
  }

  total.protein = Math.round(total.protein * 10) / 10;
  total.carbs = Math.round(total.carbs * 10) / 10;
  total.fats = Math.round(total.fats * 10) / 10;

  return total;
}

export function describeRoutineServing(routine: DailyRoutine, levels: Record<string, number>): string {
  const parts = [routine.servingDescription ?? routine.name];
  for (const mod of routine.modifiers) {
    const level = levels[mod.id] ?? routine.defaults[mod.id] ?? 0;
    const units = modifierUnits(level, mod);
    if (units > 0) {
      parts.push(`${units} ${mod.unit} ${mod.label.toLowerCase()}`);
    }
  }
  return parts.join(" · ");
}

export function buildRoutineIngredients(routine: DailyRoutine, levels: Record<string, number>): string {
  const items = [routine.name];
  for (const mod of routine.modifiers) {
    const units = modifierUnits(levels[mod.id] ?? routine.defaults[mod.id] ?? 0, mod);
    if (units > 0) items.push(`${units} ${mod.unit} ${mod.label.toLowerCase()}`);
  }
  return items.join(", ");
}
