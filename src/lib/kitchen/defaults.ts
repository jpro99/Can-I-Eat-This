// src/lib/kitchen/defaults.ts

import type { KitchenMemory, PantryItem } from "@/types";
import { normalizePantryItem } from "@/lib/kitchen/pantry-label";

export const DEFAULT_KITCHEN_MEMORY: KitchenMemory = {
  setupComplete: false,
  pantryItems: [],
  appliances: [],
  venueOrders: [],
  spiceSets: [],
  mealTemplates: [],
};

function normalizePantryList(items: PantryItem[] | undefined): PantryItem[] {
  if (!items?.length) return [];
  return items.map(normalizePantryItem);
}

export function parseKitchenMemory(raw: string | null | undefined): KitchenMemory {
  if (!raw || raw === "{}") return { ...DEFAULT_KITCHEN_MEMORY };
  try {
    const parsed = JSON.parse(raw) as KitchenMemory;
    return {
      ...DEFAULT_KITCHEN_MEMORY,
      ...parsed,
      pantryItems: normalizePantryList(parsed.pantryItems),
      appliances: parsed.appliances ?? [],
      venueOrders: parsed.venueOrders ?? [],
      spiceSets: parsed.spiceSets ?? [],
      mealTemplates: parsed.mealTemplates ?? [],
    };
  } catch {
    return { ...DEFAULT_KITCHEN_MEMORY };
  }
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
