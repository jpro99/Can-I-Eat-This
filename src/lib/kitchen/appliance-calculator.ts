// src/lib/kitchen/appliance-calculator.ts

import { findCatalogModel, getManufacturerName } from "@/lib/kitchen/appliance-catalog";
import { nutritionFromPantryVolume } from "@/lib/kitchen/pantry-nutrition";
import type { ConfiguredAppliance, KitchenMemory, NutritionFacts, PantryItem } from "@/types";

function findPantry(km: KitchenMemory, id: string): PantryItem | undefined {
  return km.pantryItems.find((p) => p.id === id);
}

export function mlForChannel(appliance: ConfiguredAppliance, channelId: string): number {
  const model = findCatalogModel(appliance.catalogModelId);
  const spec = model?.channels.find((c) => c.id === channelId);
  if (!spec) return 0;
  const seconds = appliance.channelSeconds[channelId] ?? 0;
  const mlPerSec =
    appliance.channelMlPerSecond?.[channelId] ??
    spec.mlPerSecond * appliance.calibrationFactor;
  return seconds * mlPerSec;
}

export function calculateApplianceDrink(
  appliance: ConfiguredAppliance,
  km: KitchenMemory
): { nutrition: NutritionFacts; servingDescription: string; ingredients: string } {
  const model = findCatalogModel(appliance.catalogModelId);
  const mfg = model ? getManufacturerName(model.manufacturerId) : "";
  const parts: string[] = [];
  const ingredients: string[] = [];
  const total: NutritionFacts = { calories: 0, protein: 0, carbs: 0, fats: 0, sugar: 0, sodium: 0 };

  if (appliance.includeEspresso !== false) {
    total.calories += 5;
    total.protein += 0.3;
    ingredients.push("Espresso");
    parts.push("espresso");
  }

  for (const ch of model?.channels ?? []) {
    const seconds = appliance.channelSeconds[ch.id] ?? 0;
    if (seconds <= 0) continue;
    const ml = mlForChannel(appliance, ch.id);
    const pantryId = appliance.channelPantryIds[ch.id];
    const pantry = pantryId ? findPantry(km, pantryId) : undefined;
    if (pantry) {
      const n = nutritionFromPantryVolume(pantry, ml);
      total.calories += n.calories;
      total.protein += n.protein;
      total.carbs += n.carbs;
      total.fats += n.fats;
      total.sugar = (total.sugar ?? 0) + (n.sugar ?? 0);
      total.sodium = (total.sodium ?? 0) + (n.sodium ?? 0);
      ingredients.push(`${pantry.name} (${seconds}s ≈ ${Math.round(ml)}ml)`);
    }
    parts.push(`${seconds}s ${ch.label.toLowerCase()}`);
  }

  const name = appliance.nickname || model?.fullName || "Coffee";
  const servingDescription = [
    name,
    parts.join(" · "),
    appliance.vesselLabel,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    nutrition: {
      ...total,
      protein: Math.round(total.protein * 10) / 10,
      carbs: Math.round(total.carbs * 10) / 10,
      fats: Math.round(total.fats * 10) / 10,
    },
    servingDescription,
    ingredients: ingredients.join(", ") || `${mfg} ${model?.name ?? "coffee"}`,
  };
}

export function describeApplianceShort(appliance: ConfiguredAppliance): string {
  const model = findCatalogModel(appliance.catalogModelId);
  const secs = Object.entries(appliance.channelSeconds)
    .filter(([, s]) => s > 0)
    .map(([id, s]) => {
      const label = model?.channels.find((c) => c.id === id)?.label ?? id;
      return `${s}s ${label.toLowerCase()}`;
    });
  return secs.join(" · ") || "Default pour";
}
