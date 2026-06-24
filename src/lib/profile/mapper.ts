// src/lib/profile/mapper.ts

import type { UserProfile } from "@prisma/client";
import type { Supplement, DailyRoutine, UserProfileData } from "@/types";
import { parseJsonArray } from "@/lib/utils";
import { DEFAULT_DAILY_ROUTINES } from "@/lib/routines/defaults";
import { parseKitchenMemory } from "@/lib/kitchen/defaults";

function parseSupplements(value: string): Supplement[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseDailyRoutines(value: string | undefined | null): DailyRoutine[] {
  if (!value || value === "[]") return DEFAULT_DAILY_ROUTINES;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_DAILY_ROUTINES;
  } catch {
    return DEFAULT_DAILY_ROUTINES;
  }
}

export function mapProfile(profile: UserProfile): UserProfileData {
  return {
    id: profile.id,
    name: profile.name,
    age: profile.age,
    sex: profile.sex as UserProfileData["sex"],
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    goalWeightKg: profile.goalWeightKg,
    activityLevel: profile.activityLevel as UserProfileData["activityLevel"],
    healthGoal: profile.healthGoal as UserProfileData["healthGoal"],
    strictness: profile.strictness as UserProfileData["strictness"],
    targetCalories: profile.targetCalories,
    targetProtein: profile.targetProtein,
    targetCarbs: profile.targetCarbs,
    targetFats: profile.targetFats,
    targetFiber: profile.targetFiber,
    targetSodium: profile.targetSodium,
    targetSugar: profile.targetSugar,
    targetWaterMl: profile.targetWaterMl,
    supplements: parseSupplements(profile.supplements),
    avoidGmo: profile.avoidGmo,
    allergies: parseJsonArray(profile.allergies),
    foodsToAvoid: parseJsonArray(profile.foodsToAvoid),
    ingredientClassesToAvoid: parseJsonArray(profile.ingredientClassesToAvoid),
    avoidSeedOils: profile.avoidSeedOils,
    scoreEatThreshold: profile.scoreEatThreshold,
    scoreCautionThreshold: profile.scoreCautionThreshold,
    onboardingComplete: profile.onboardingComplete,
    dailyRoutines: parseDailyRoutines(profile.dailyRoutines),
    kitchenMemory: parseKitchenMemory(profile.kitchenMemory),
  };
}

export function profileToDbFields(data: Partial<UserProfileData>) {
  return {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.age !== undefined && { age: data.age }),
    ...(data.sex !== undefined && { sex: data.sex }),
    ...(data.heightCm !== undefined && { heightCm: data.heightCm }),
    ...(data.weightKg !== undefined && { weightKg: data.weightKg }),
    ...(data.goalWeightKg !== undefined && { goalWeightKg: data.goalWeightKg }),
    ...(data.activityLevel !== undefined && { activityLevel: data.activityLevel }),
    ...(data.healthGoal !== undefined && { healthGoal: data.healthGoal }),
    ...(data.strictness !== undefined && { strictness: data.strictness }),
    ...(data.targetCalories !== undefined && { targetCalories: data.targetCalories }),
    ...(data.targetProtein !== undefined && { targetProtein: data.targetProtein }),
    ...(data.targetCarbs !== undefined && { targetCarbs: data.targetCarbs }),
    ...(data.targetFats !== undefined && { targetFats: data.targetFats }),
    ...(data.targetFiber !== undefined && { targetFiber: data.targetFiber }),
    ...(data.targetSodium !== undefined && { targetSodium: data.targetSodium }),
    ...(data.targetSugar !== undefined && { targetSugar: data.targetSugar }),
    ...(data.targetWaterMl !== undefined && { targetWaterMl: data.targetWaterMl }),
    ...(data.supplements !== undefined && { supplements: JSON.stringify(data.supplements) }),
    ...(data.avoidGmo !== undefined && { avoidGmo: data.avoidGmo }),
    ...(data.allergies !== undefined && { allergies: JSON.stringify(data.allergies) }),
    ...(data.foodsToAvoid !== undefined && { foodsToAvoid: JSON.stringify(data.foodsToAvoid) }),
    ...(data.ingredientClassesToAvoid !== undefined && {
      ingredientClassesToAvoid: JSON.stringify(data.ingredientClassesToAvoid),
    }),
    ...(data.avoidSeedOils !== undefined && { avoidSeedOils: data.avoidSeedOils }),
    ...(data.scoreEatThreshold !== undefined && { scoreEatThreshold: data.scoreEatThreshold }),
    ...(data.scoreCautionThreshold !== undefined && {
      scoreCautionThreshold: data.scoreCautionThreshold,
    }),
    ...(data.onboardingComplete !== undefined && { onboardingComplete: data.onboardingComplete }),
    ...(data.dailyRoutines !== undefined && { dailyRoutines: JSON.stringify(data.dailyRoutines) }),
    ...(data.kitchenMemory !== undefined && { kitchenMemory: JSON.stringify(data.kitchenMemory) }),
  };
}

export const DEFAULT_SUPPLEMENTS: Supplement[] = [
  {
    id: "creatine",
    name: "Creatine",
    active: false,
    requiresHydration: true,
    hydrationNote: "Drink extra water when taking creatine — aim for 16+ fl oz above your normal intake.",
  },
];
