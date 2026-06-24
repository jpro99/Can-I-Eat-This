// src/lib/nutrition/portions.ts — US serving sizes for eating out and at home

import type { MealOrigin, PortionMethod } from "@/types";

export interface PortionOption {
  id: PortionMethod;
  label: string;
  multiplier: number;
  desc: string;
  group: "restaurant" | "us_measure" | "visual" | "other";
}

export const PORTION_GROUPS: { title: string; options: PortionOption[] }[] = [
  {
    title: "Restaurant & to-go",
    options: [
      { id: "restaurant_small", label: "Small / side / appetizer", multiplier: 0.65, desc: "Kids meal, side dish, half entree", group: "restaurant" },
      { id: "restaurant_regular", label: "Regular entree", multiplier: 1.0, desc: "Standard menu portion", group: "restaurant" },
      { id: "restaurant_large", label: "Large / super-sized", multiplier: 1.45, desc: "Big plate, extra meat, family size", group: "restaurant" },
      { id: "shared", label: "Split / shared", multiplier: 0.5, desc: "Split with someone or took half home", group: "restaurant" },
      { id: "half_plate", label: "Half plate", multiplier: 0.5, desc: "Ate about half of what was served", group: "restaurant" },
    ],
  },
  {
    title: "Cups & bowls",
    options: [
      { id: "quarter_cup", label: "¼ cup", multiplier: 0.25, desc: "Nuts, dips, dressing, berries", group: "us_measure" },
      { id: "half_cup", label: "½ cup", multiplier: 0.5, desc: "Cooked rice, pasta, veggies", group: "us_measure" },
      { id: "cup", label: "1 cup", multiplier: 1.0, desc: "Rice, salad, soup, cereal", group: "us_measure" },
      { id: "two_cups", label: "2 cups", multiplier: 2.0, desc: "Large salad, big bowl, pint", group: "us_measure" },
    ],
  },
  {
    title: "Protein (oz)",
    options: [
      { id: "oz_3", label: "3 oz", multiplier: 0.75, desc: "Deck-of-cards — chicken, fish, lean meat", group: "us_measure" },
      { id: "oz_4", label: "4 oz", multiplier: 1.0, desc: "Standard protein serving", group: "us_measure" },
      { id: "oz_6", label: "6 oz", multiplier: 1.5, desc: "Restaurant chicken breast or steak", group: "us_measure" },
      { id: "oz_8", label: "8 oz", multiplier: 2.0, desc: "Large cut, double protein", group: "us_measure" },
    ],
  },
  {
    title: "Other US measures",
    options: [
      { id: "tbsp", label: "1 tbsp", multiplier: 0.06, desc: "Butter, oil, sauce, dressing", group: "us_measure" },
      { id: "slice", label: "1 slice", multiplier: 0.15, desc: "Bread, pizza, pie, deli meat", group: "us_measure" },
      { id: "piece", label: "1 piece", multiplier: 0.2, desc: "Roll, wing, nugget, sushi piece", group: "us_measure" },
    ],
  },
  {
    title: "Hand estimates",
    options: [
      { id: "visual_palm", label: "Palm-sized protein", multiplier: 1.0, desc: "~3–4 oz meat or fish", group: "visual" },
      { id: "visual_fist", label: "Fist-sized carb", multiplier: 1.0, desc: "~1 cup rice, pasta, or potato", group: "visual" },
      { id: "visual_cup", label: "Cupped handful", multiplier: 0.75, desc: "~½ cup nuts, chips, snacks", group: "visual" },
      { id: "visual_thumb", label: "Thumb-sized fat", multiplier: 1.0, desc: "~1 tbsp cheese, nut butter, oil", group: "visual" },
    ],
  },
  {
    title: "Other",
    options: [
      { id: "scale", label: "Weighed on scale", multiplier: 1.0, desc: "Most accurate — entered by weight", group: "other" },
      { id: "label", label: "From label serving", multiplier: 1.0, desc: "Packaged food nutrition label", group: "other" },
      { id: "default", label: "Standard estimate", multiplier: 1.0, desc: "AI / photo estimate as-is", group: "other" },
    ],
  },
];

export const PORTION_OPTIONS: PortionOption[] = PORTION_GROUPS.flatMap((g) => g.options);

export function defaultPortionMethod(origin?: MealOrigin): PortionMethod {
  if (origin === "restaurant") return "restaurant_regular";
  return "default";
}

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

type ScalableNutrition = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  sodium?: number;
  sugar?: number;
  fiber?: number;
};

export function applyPortionMultiplier(
  nutrition: ScalableNutrition,
  method: PortionMethod,
  servings: number
): ScalableNutrition {
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

export function scalePlateItems<T extends ScalableNutrition & { id: string; name: string; portion: string; confidence: number }>(
  items: T[],
  method: PortionMethod,
  servings: number
): T[] {
  const opt = PORTION_OPTIONS.find((p) => p.id === method);
  const mult = (opt?.multiplier ?? 1) * servings;
  return items.map((item) => ({
    ...item,
    calories: Math.round(item.calories * mult),
    protein: Math.round(item.protein * mult * 10) / 10,
    carbs: Math.round(item.carbs * mult * 10) / 10,
    fats: Math.round(item.fats * mult * 10) / 10,
    sodium: Math.round((item.sodium ?? 0) * mult),
    sugar: Math.round((item.sugar ?? 0) * mult * 10) / 10,
    fiber: Math.round((item.fiber ?? 0) * mult * 10) / 10,
  }));
}
