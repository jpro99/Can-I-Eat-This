// src/lib/nutrition/micronutrients.ts

import type { Micronutrients, MicronutrientStatus, UserProfileData } from "@/types";

export const MICRO_LABELS: Record<keyof Micronutrients, { label: string; unit: string }> = {
  vitaminA: { label: "Vitamin A", unit: "mcg" },
  vitaminC: { label: "Vitamin C", unit: "mg" },
  vitaminD: { label: "Vitamin D", unit: "mcg" },
  vitaminE: { label: "Vitamin E", unit: "mg" },
  vitaminK: { label: "Vitamin K", unit: "mcg" },
  vitaminB12: { label: "Vitamin B12", unit: "mcg" },
  folate: { label: "Folate", unit: "mcg" },
  iron: { label: "Iron", unit: "mg" },
  calcium: { label: "Calcium", unit: "mg" },
  magnesium: { label: "Magnesium", unit: "mg" },
  potassium: { label: "Potassium", unit: "mg" },
  zinc: { label: "Zinc", unit: "mg" },
  omega3: { label: "Omega-3", unit: "g" },
};

export function getMicronutrientTargets(profile: Pick<UserProfileData, "sex" | "age">): Micronutrients {
  const isFemale = profile.sex === "female";
  return {
    vitaminA: 900,
    vitaminC: isFemale ? 75 : 90,
    vitaminD: 20,
    vitaminE: 15,
    vitaminK: isFemale ? 90 : 120,
    vitaminB12: 2.4,
    folate: 400,
    iron: isFemale ? 18 : 8,
    calcium: profile.age > 50 ? 1200 : 1000,
    magnesium: isFemale ? 320 : 420,
    potassium: 3400,
    zinc: isFemale ? 8 : 11,
    omega3: 1.1,
  };
}

export function emptyMicronutrients(): Micronutrients {
  return {};
}

export function sumMicronutrients(items: Micronutrients[]): Micronutrients {
  const result: Micronutrients = {};
  for (const item of items) {
    for (const [key, val] of Object.entries(item) as [keyof Micronutrients, number][]) {
      if (typeof val === "number") {
        result[key] = (result[key] ?? 0) + val;
      }
    }
  }
  return result;
}

export function parseMicronutrients(json: string): Micronutrients {
  try {
    return JSON.parse(json || "{}") as Micronutrients;
  } catch {
    return {};
  }
}

export function estimateMicronutrientsFromFood(foodName: string, nutrition: { protein: number; carbs: number; fats: number; fiber?: number }): Micronutrients {
  const name = foodName.toLowerCase();
  const micro: Micronutrients = {};

  if (/salmon|sardine|mackerel|fish/.test(name)) {
    micro.omega3 = 1.5;
    micro.vitaminD = 10;
    micro.vitaminB12 = 4;
  }
  if (/egg/.test(name)) {
    micro.vitaminD = 1;
    micro.vitaminB12 = 0.6;
    micro.iron = 0.9;
  }
  if (/spinach|kale|broccoli|greens/.test(name)) {
    micro.vitaminA = 500;
    micro.vitaminC = 30;
    micro.vitaminK = 100;
    micro.iron = 2;
    micro.magnesium = 50;
    micro.folate = 100;
  }
  if (/orange|strawberr|blueberr|fruit|banana|apple/.test(name)) {
    micro.vitaminC = 40;
    micro.potassium = 300;
  }
  if (/milk|yogurt|cheese|dairy/.test(name)) {
    micro.calcium = 200;
    micro.vitaminD = 2;
    micro.vitaminB12 = 0.8;
  }
  if (/beef|steak|red meat|liver/.test(name)) {
    micro.iron = 2.5;
    micro.zinc = 4;
    micro.vitaminB12 = 2;
  }
  if (/bean|lentil|chickpea/.test(name)) {
    micro.iron = 3;
    micro.folate = 150;
    micro.magnesium = 60;
  }
  if (/nut|almond|walnut|seed/.test(name)) {
    micro.vitaminE = 5;
    micro.magnesium = 80;
    micro.zinc = 2;
  }
  if ((nutrition.fiber ?? 0) > 5) {
    micro.magnesium = (micro.magnesium ?? 0) + 20;
    micro.potassium = (micro.potassium ?? 0) + 150;
  }

  return micro;
}

export function buildMicronutrientStatus(
  consumed: Micronutrients,
  targets: Micronutrients
): MicronutrientStatus[] {
  const keys = Object.keys(MICRO_LABELS) as (keyof Micronutrients)[];
  return keys.map((key) => {
    const c = consumed[key] ?? 0;
    const t = targets[key] ?? 1;
    const pct = Math.min((c / t) * 100, 100);
    let status: MicronutrientStatus["status"] = "good";
    if (pct < 40) status = "depleted";
    else if (pct < 70) status = "low";
    return {
      key,
      label: MICRO_LABELS[key].label,
      unit: MICRO_LABELS[key].unit,
      consumed: Math.round(c * 10) / 10,
      target: t,
      pct: Math.round(pct),
      status,
    };
  });
}

export function getDepletedNutrients(status: MicronutrientStatus[]): MicronutrientStatus[] {
  return status.filter((s) => s.status === "depleted" || s.status === "low").slice(0, 5);
}

export function foodSuggestionsForDepletion(depleted: MicronutrientStatus[]): string[] {
  const suggestions: string[] = [];
  for (const d of depleted) {
    switch (d.key) {
      case "iron":
        suggestions.push("Spinach, lean red meat, or lentils for iron");
        break;
      case "vitaminD":
        suggestions.push("Salmon, eggs, or fortified dairy for vitamin D");
        break;
      case "calcium":
        suggestions.push("Greek yogurt, cottage cheese, or sardines for calcium");
        break;
      case "vitaminC":
        suggestions.push("Berries, citrus, or bell peppers for vitamin C");
        break;
      case "magnesium":
        suggestions.push("Pumpkin seeds, almonds, or dark leafy greens for magnesium");
        break;
      case "omega3":
        suggestions.push("Salmon, sardines, or walnuts for omega-3");
        break;
      case "vitaminB12":
        suggestions.push("Eggs, fish, or lean meat for B12");
        break;
      case "potassium":
        suggestions.push("Bananas, potatoes, or avocado for potassium");
        break;
      default:
        suggestions.push(`Whole foods rich in ${d.label.toLowerCase()}`);
    }
  }
  return [...new Set(suggestions)].slice(0, 4);
}
