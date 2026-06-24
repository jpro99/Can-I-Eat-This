// src/lib/kitchen/defaults.ts

import type { KitchenMemory, PantryItem } from "@/types";
import { defaultNutritionForPantryType } from "@/lib/kitchen/pantry-nutrition";

function pantry(id: string, name: string, type: PantryItem["type"]): PantryItem {
  const n = defaultNutritionForPantryType(type);
  return {
    id,
    name,
    type,
    calories: n.calories,
    protein: n.protein,
    carbs: n.carbs,
    fats: n.fats,
    sugar: n.sugar,
    sodium: n.sodium,
    perTsp: n.perTsp,
  };
}

export const DEFAULT_KITCHEN_MEMORY: KitchenMemory = {
  setupComplete: false,
  pantryItems: [
    pantry("pantry-whole-milk", "Whole milk", "whole_milk"),
    pantry("pantry-cream", "Heavy cream", "cream"),
    pantry("pantry-half-half", "Half & half", "half_and_half"),
    pantry("pantry-oat-milk", "Oat milk", "oat_milk"),
  ],
  appliances: [],
  venueOrders: [],
  spiceSets: [],
  mealTemplates: [],
};

export function parseKitchenMemory(raw: string | null | undefined): KitchenMemory {
  if (!raw || raw === "{}") return { ...DEFAULT_KITCHEN_MEMORY, pantryItems: [...DEFAULT_KITCHEN_MEMORY.pantryItems] };
  try {
    const parsed = JSON.parse(raw) as KitchenMemory;
    return {
      ...DEFAULT_KITCHEN_MEMORY,
      ...parsed,
      pantryItems: parsed.pantryItems?.length ? parsed.pantryItems : DEFAULT_KITCHEN_MEMORY.pantryItems,
      appliances: parsed.appliances ?? [],
      venueOrders: parsed.venueOrders ?? [],
      spiceSets: parsed.spiceSets ?? [],
      mealTemplates: parsed.mealTemplates ?? [],
    };
  } catch {
    return { ...DEFAULT_KITCHEN_MEMORY, pantryItems: [...DEFAULT_KITCHEN_MEMORY.pantryItems] };
  }
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
