// src/lib/kitchen/pantry-nutrition.ts — per 100 ml unless noted

import type { PantryItemType } from "@/types";

export const PANTRY_TYPE_LABELS: Record<PantryItemType, string> = {
  whole_milk: "Whole milk",
  skim_milk: "Skim milk",
  oat_milk: "Oat milk",
  almond_milk: "Almond milk",
  cream: "Heavy cream",
  half_and_half: "Half & half",
  spice: "Spice / seasoning",
  sauce: "Sauce / condiment",
  other: "Other",
};

/** Nutrition per 100 ml (or per tsp for spice via perTsp flag) */
export function defaultNutritionForPantryType(type: PantryItemType): {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  sugar?: number;
  sodium?: number;
  perTsp?: boolean;
} {
  switch (type) {
    case "whole_milk":
      return { calories: 61, protein: 3.2, carbs: 4.8, fats: 3.3, sugar: 5.1 };
    case "skim_milk":
      return { calories: 34, protein: 3.4, carbs: 5, fats: 0.1, sugar: 5 };
    case "oat_milk":
      return { calories: 48, protein: 1, carbs: 7, fats: 2.5, sugar: 2.5 };
    case "almond_milk":
      return { calories: 15, protein: 0.6, carbs: 0.6, fats: 1.2, sugar: 0.2 };
    case "cream":
      return { calories: 340, protein: 2.8, carbs: 2.8, fats: 36, sugar: 2.9 };
    case "half_and_half":
      return { calories: 133, protein: 3, carbs: 4.3, fats: 11.5, sugar: 4.1 };
    case "spice":
      return { calories: 6, protein: 0.3, carbs: 1.3, fats: 0.3, sodium: 1, perTsp: true };
    case "sauce":
      return { calories: 15, protein: 0.2, carbs: 3, fats: 0.1, sodium: 120, perTsp: true };
    default:
      return { calories: 50, protein: 1, carbs: 5, fats: 2 };
  }
}

export function nutritionFromPantryVolume(
  item: { type: PantryItemType; calories: number; protein: number; carbs: number; fats: number; sugar?: number; sodium?: number; perTsp?: boolean },
  amountMl: number
) {
  if (item.perTsp) {
    const tsp = amountMl / 5;
    return {
      calories: Math.round(item.calories * tsp),
      protein: Math.round(item.protein * tsp * 10) / 10,
      carbs: Math.round(item.carbs * tsp * 10) / 10,
      fats: Math.round(item.fats * tsp * 10) / 10,
      sugar: Math.round((item.sugar ?? 0) * tsp * 10) / 10,
      sodium: Math.round((item.sodium ?? 0) * tsp),
    };
  }
  const factor = amountMl / 100;
  return {
    calories: Math.round(item.calories * factor),
    protein: Math.round(item.protein * factor * 10) / 10,
    carbs: Math.round(item.carbs * factor * 10) / 10,
    fats: Math.round(item.fats * factor * 10) / 10,
    sugar: Math.round((item.sugar ?? 0) * factor * 10) / 10,
    sodium: Math.round((item.sodium ?? 0) * factor),
  };
}
