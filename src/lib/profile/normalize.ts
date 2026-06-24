// src/lib/profile/normalize.ts — safe defaults for cached / partial profiles (client + server)

import { DEFAULT_KITCHEN_MEMORY } from "@/lib/kitchen/defaults";
import { normalizePantryItem } from "@/lib/kitchen/pantry-label";
import { DEFAULT_DAILY_ROUTINES } from "@/lib/routines/defaults";
import type { KitchenMemory, PantryItem, UserProfileData } from "@/types";

function ensureKitchenMemory(km: Partial<KitchenMemory> | undefined | null): KitchenMemory {
  if (!km || typeof km !== "object") {
    return { ...DEFAULT_KITCHEN_MEMORY };
  }
  const pantryItems: PantryItem[] = Array.isArray(km.pantryItems)
    ? km.pantryItems.map(normalizePantryItem)
    : [];
  return {
    setupComplete: km.setupComplete ?? false,
    pantryItems,
    appliances: Array.isArray(km.appliances) ? km.appliances : [],
    venueOrders: Array.isArray(km.venueOrders) ? km.venueOrders : [],
    spiceSets: Array.isArray(km.spiceSets) ? km.spiceSets : [],
    mealTemplates: Array.isArray(km.mealTemplates) ? km.mealTemplates : [],
  };
}

export function normalizeProfile(data: Partial<UserProfileData> & { id?: string }): UserProfileData {
  return {
    id: data.id ?? "",
    name: data.name ?? "",
    age: data.age ?? 30,
    sex: data.sex ?? "other",
    heightCm: data.heightCm ?? 170,
    weightKg: data.weightKg ?? 70,
    goalWeightKg: data.goalWeightKg,
    activityLevel: data.activityLevel ?? "moderate",
    healthGoal: data.healthGoal ?? "maintain",
    strictness: data.strictness ?? "moderate",
    targetCalories: data.targetCalories,
    targetProtein: data.targetProtein,
    targetCarbs: data.targetCarbs,
    targetFats: data.targetFats,
    targetFiber: data.targetFiber,
    targetSodium: data.targetSodium,
    targetSugar: data.targetSugar,
    targetWaterMl: data.targetWaterMl,
    supplements: Array.isArray(data.supplements) ? data.supplements : [],
    avoidGmo: data.avoidGmo ?? false,
    allergies: Array.isArray(data.allergies) ? data.allergies : [],
    foodsToAvoid: Array.isArray(data.foodsToAvoid) ? data.foodsToAvoid : [],
    ingredientClassesToAvoid: Array.isArray(data.ingredientClassesToAvoid)
      ? data.ingredientClassesToAvoid
      : [],
    avoidSeedOils: data.avoidSeedOils ?? false,
    scoreEatThreshold: data.scoreEatThreshold ?? 80,
    scoreCautionThreshold: data.scoreCautionThreshold ?? 55,
    onboardingComplete: data.onboardingComplete ?? false,
    dailyRoutines:
      Array.isArray(data.dailyRoutines) && data.dailyRoutines.length > 0
        ? data.dailyRoutines
        : DEFAULT_DAILY_ROUTINES,
    kitchenMemory: ensureKitchenMemory(data.kitchenMemory),
    waterVessels: Array.isArray(data.waterVessels) ? data.waterVessels : [],
    defaultWaterVesselId: data.defaultWaterVesselId ?? null,
  };
}
