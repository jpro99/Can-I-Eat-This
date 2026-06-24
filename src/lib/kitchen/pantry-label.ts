// src/lib/kitchen/pantry-label.ts — label scan → pantry nutrition, verification rules

import type { ApplianceCatalogModel, KitchenMemory, MachineDrinkPreset, PantryItem, PantryItemType } from "@/types";
import { PANTRY_TYPE_LABELS } from "@/lib/kitchen/pantry-nutrition";

/** Types that must come from a photographed label — no USDA guesses */
export const LABEL_REQUIRED_TYPES: PantryItemType[] = [
  "whole_milk",
  "skim_milk",
  "oat_milk",
  "almond_milk",
  "cream",
  "half_and_half",
  "spice",
  "sauce",
  "other",
];

export function pantryTypeRequiresLabel(type: PantryItemType): boolean {
  return LABEL_REQUIRED_TYPES.includes(type);
}

export function isPantryVerified(item: PantryItem | undefined): boolean {
  return !!item?.labelVerified;
}

export function normalizePantryItem(item: PantryItem): PantryItem {
  return {
    ...item,
    labelVerified: item.labelVerified ?? false,
  };
}

export function servingSizeToMl(servingSize: string): number | null {
  const s = servingSize.toLowerCase();
  const mlMatch = s.match(/(\d+(?:\.\d+)?)\s*ml\b/);
  if (mlMatch) return parseFloat(mlMatch[1]);
  const cupMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:cup|c\b)/);
  if (cupMatch) return parseFloat(cupMatch[1]) * 240;
  const flOzMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:fl\s*oz|floz)\b/);
  if (flOzMatch) return parseFloat(flOzMatch[1]) * 29.57;
  const tbspMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:tbsp|tablespoon)/);
  if (tbspMatch) return parseFloat(tbspMatch[1]) * 15;
  const tspMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:tsp|teaspoon)/);
  if (tspMatch) return parseFloat(tspMatch[1]) * 5;
  return null;
}

export function labelNutritionToPantryFields(
  parsed: {
    foodName: string;
    brand?: string;
    servingSize?: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    sugar?: number;
    sodium?: number;
  },
  type: PantryItemType
): Pick<
  PantryItem,
  "name" | "brand" | "servingSize" | "calories" | "protein" | "carbs" | "fats" | "sugar" | "sodium" | "perTsp" | "labelVerified" | "labelScannedAt"
> {
  const servingMl = parsed.servingSize ? servingSizeToMl(parsed.servingSize) : null;
  const isSpiceOrSauce = type === "spice" || type === "sauce";
  const perTsp =
    isSpiceOrSauce ||
    (servingMl != null && servingMl <= 20) ||
    (parsed.servingSize?.toLowerCase().includes("tsp") ?? false);

  if (perTsp) {
    const tsp = servingMl != null && servingMl > 0 ? servingMl / 5 : 1;
    const factor = 1 / tsp;
    return {
      name: parsed.foodName || PANTRY_TYPE_LABELS[type],
      brand: parsed.brand,
      servingSize: parsed.servingSize,
      calories: Math.round(parsed.calories * factor),
      protein: Math.round(parsed.protein * factor * 10) / 10,
      carbs: Math.round(parsed.carbs * factor * 10) / 10,
      fats: Math.round(parsed.fats * factor * 10) / 10,
      sugar: Math.round((parsed.sugar ?? 0) * factor * 10) / 10,
      sodium: Math.round((parsed.sodium ?? 0) * factor),
      perTsp: true,
      labelVerified: true,
      labelScannedAt: new Date().toISOString(),
    };
  }

  const ml = servingMl && servingMl > 0 ? servingMl : 240;
  const factor = 100 / ml;
  return {
    name: parsed.foodName || PANTRY_TYPE_LABELS[type],
    brand: parsed.brand,
    servingSize: parsed.servingSize,
    calories: Math.round(parsed.calories * factor),
    protein: Math.round(parsed.protein * factor * 10) / 10,
    carbs: Math.round(parsed.carbs * factor * 10) / 10,
    fats: Math.round(parsed.fats * factor * 10) / 10,
    sugar: Math.round((parsed.sugar ?? 0) * factor * 10) / 10,
    sodium: Math.round((parsed.sodium ?? 0) * factor),
    perTsp: false,
    labelVerified: true,
    labelScannedAt: new Date().toISOString(),
  };
}

export interface PantryRequirement {
  type: PantryItemType;
  channelId?: string;
  channelLabel: string;
  reason: string;
}

export function getPantryRequirements(
  model: ApplianceCatalogModel,
  channelSeconds: Record<string, number>,
  drinkPreset?: MachineDrinkPreset
): PantryRequirement[] {
  const reqs: PantryRequirement[] = [];
  const seen = new Set<PantryItemType>();

  const addReq = (type: PantryItemType, channelLabel: string, reason: string, channelId?: string) => {
    if (seen.has(type)) return;
    seen.add(type);
    reqs.push({ type, channelId, channelLabel, reason });
  };

  if (drinkPreset?.requiredPantryTypes?.length) {
    for (const type of drinkPreset.requiredPantryTypes) {
      const ch = model.channels.find((c) => c.defaultLiquidType === type);
      addReq(
        type,
        ch?.label ?? PANTRY_TYPE_LABELS[type],
        type === "cream"
          ? `Your ${drinkPreset.label} uses milk and cream together — photograph your cream carton even if it's mixed in the machine.`
          : `Your ${drinkPreset.label} uses ${PANTRY_TYPE_LABELS[type].toLowerCase()} — photograph that exact product's nutrition label.`,
        ch?.id
      );
    }
    return reqs;
  }

  for (const ch of model.channels) {
    if (ch.defaultLiquidType === "other") continue;
    if ((channelSeconds[ch.id] ?? 0) <= 0) continue;
    addReq(
      ch.defaultLiquidType,
      ch.label,
      `Your drink uses ${ch.label.toLowerCase()} — photograph that exact product's nutrition label.`,
      ch.id
    );
  }
  return reqs;
}

export function findVerifiedPantryForType(km: KitchenMemory, type: PantryItemType): PantryItem | undefined {
  return km.pantryItems.find((p) => p.type === type && isPantryVerified(p));
}

export function missingPantryVerifications(
  km: KitchenMemory,
  requirements: PantryRequirement[]
): PantryRequirement[] {
  return requirements.filter((r) => !findVerifiedPantryForType(km, r.type));
}

export function describePantryScanPrompt(type: PantryItemType, channelLabel?: string): string {
  const product = PANTRY_TYPE_LABELS[type];
  if (channelLabel) {
    return `Photograph the nutrition label on your ${product.toLowerCase()} (${channelLabel}). We won't guess — your label is the source of truth.`;
  }
  return `Photograph the nutrition label on your ${product.toLowerCase()}. We won't guess — your label is the source of truth.`;
}

export function unverifiedPantryForAppliance(
  km: KitchenMemory,
  model: ApplianceCatalogModel | undefined,
  channelSeconds: Record<string, number>,
  _channelPantryIds: Record<string, string>,
  drinkPreset?: MachineDrinkPreset
): PantryRequirement[] {
  if (!model) return [];
  return missingPantryVerifications(km, getPantryRequirements(model, channelSeconds, drinkPreset));
}
