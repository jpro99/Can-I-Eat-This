// src/lib/kitchen/appliance-calculator.ts

import { findCatalogModel, getManufacturerName } from "@/lib/kitchen/appliance-catalog";
import { COFFEE_CHANNEL_ID, isCoffeeChannel } from "@/lib/kitchen/appliance-sliders";
import { isPantryVerified } from "@/lib/kitchen/pantry-label";
import { nutritionFromPantryVolume } from "@/lib/kitchen/pantry-nutrition";
import type { ConfiguredAppliance, KitchenMemory, NutritionFacts, PantryItem } from "@/types";

const ESPRESSO_BASE_CAL = 5;
const ESPRESSO_BASE_PROTEIN = 0.3;
const ESPRESSO_BASE_ML = 30;
const LEGACY_DEFAULT_COFFEE_SEC = 6;

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

function addEspressoNutrition(total: NutritionFacts, ml: number, baseMl: number) {
  if (ml <= 0) return;
  const scale = ml / baseMl;
  total.calories += ESPRESSO_BASE_CAL * scale;
  total.protein += ESPRESSO_BASE_PROTEIN * scale;
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
  const baseMl = model?.espressoBaseMl ?? ESPRESSO_BASE_ML;

  const hasCoffeeChannel = model?.channels.some((c) => c.id === COFFEE_CHANNEL_ID);
  const coffeeSeconds = appliance.channelSeconds[COFFEE_CHANNEL_ID] ?? 0;

  if (hasCoffeeChannel && coffeeSeconds > 0) {
    const ml = mlForChannel(appliance, COFFEE_CHANNEL_ID);
    addEspressoNutrition(total, ml, baseMl);
    ingredients.push(`Espresso (${coffeeSeconds}s ≈ ${Math.round(ml)}ml)`);
    parts.push(`${coffeeSeconds}s coffee`);
  } else if (appliance.includeEspresso !== false) {
    const legacySec = coffeeSeconds > 0 ? coffeeSeconds : LEGACY_DEFAULT_COFFEE_SEC;
    const ml = (legacySec / LEGACY_DEFAULT_COFFEE_SEC) * baseMl;
    addEspressoNutrition(total, ml, baseMl);
    ingredients.push("Espresso");
    parts.push(`${legacySec}s coffee`);
  }

  for (const ch of model?.channels ?? []) {
    if (isCoffeeChannel(ch.id)) continue;
    const seconds = appliance.channelSeconds[ch.id] ?? 0;
    if (seconds <= 0) continue;
    const ml = mlForChannel(appliance, ch.id);
    const pantryId = appliance.channelPantryIds[ch.id];
    const pantry = pantryId ? findPantry(km, pantryId) : undefined;
    if (pantry && isPantryVerified(pantry)) {
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

  const drinkLabel = appliance.usualDrinkLabel;
  const name = appliance.nickname || model?.fullName || "Coffee";
  const servingDescription = [name, drinkLabel, parts.join(" · "), appliance.vesselLabel]
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
  const drink = appliance.usualDrinkLabel;
  const secs = Object.entries(appliance.channelSeconds)
    .filter(([, s]) => s > 0)
    .map(([id, s]) => {
      if (isCoffeeChannel(id)) return `${s}s coffee`;
      const label = model?.channels.find((c) => c.id === id)?.label ?? id;
      return `${s}s ${label.toLowerCase()}`;
    });
  const timing = secs.join(" · ") || "Default pour";
  return drink ? `${drink} · ${timing}` : timing;
}
