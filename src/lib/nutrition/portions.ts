// src/lib/nutrition/portions.ts

import type { MealOrigin, PortionMethod } from "@/types";

export const PORTION_OPTIONS: { id: PortionMethod; label: string; multiplier: number; desc: string }[] = [
  { id: "visual_palm", label: "Palm-sized protein", multiplier: 1.0, desc: "~3–4 oz meat/fish" },
  { id: "visual_fist", label: "Fist-sized carb", multiplier: 1.0, desc: "~1 cup rice/pasta" },
  { id: "visual_cup", label: "Cupped hand", multiplier: 0.75, desc: "~1/2 cup nuts/snacks" },
  { id: "scale", label: "Weighed on scale", multiplier: 1.0, desc: "Most accurate" },
  { id: "label", label: "From label serving", multiplier: 1.0, desc: "Packaged food" },
  { id: "default", label: "Standard serving", multiplier: 1.0, desc: "Default estimate" },
];

export function originConfidenceBoost(origin?: MealOrigin): number {
  switch (origin) {
    case "homemade":
      return 0.1;
    case "store":
      return 0.15;
    case "restaurant":
      return -0.1;
    default:
      return 0;
  }
}

export function originLabel(origin?: MealOrigin): string {
  switch (origin) {
    case "homemade":
      return "Homemade";
    case "store":
      return "Store-bought";
    case "restaurant":
      return "Restaurant";
    default:
      return "Unknown";
  }
}

export function applyPortionMultiplier(
  nutrition: { calories: number; protein: number; carbs: number; fats: number; sodium?: number; sugar?: number; fiber?: number },
  method: PortionMethod,
  servings: number
) {
  const opt = PORTION_OPTIONS.find((p) => p.id === method);
  const mult = (opt?.multiplier ?? 1) * servings;
  return {
    calories: Math.round(nutrition.calories * mult),
    protein: Math.round(nutrition.protein * mult * 10) / 10,
    carbs: Math.round(nutrition.carbs * mult * 10) / 10,
    fats: Math.round(nutrition.fats * mult * 10) / 10,
    sodium: Math.round((nutrition.sodium ?? 0) * mult),
    sugar: Math.round((nutrition.sugar ?? 0) * mult * 10) / 10,
    fiber: Math.round((nutrition.fiber ?? 0) * mult * 10) / 10,
  };
}
