// src/lib/nutrition/calculator.ts

import type { ActivityLevel, Sex, UserProfileData } from "@/types";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

function bmrMifflin(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === "male") return base + 5;
  if (sex === "female") return base - 161;
  return base - 78;
}

export function calculateTDEE(profile: Pick<UserProfileData, "sex" | "weightKg" | "heightCm" | "age" | "activityLevel">): number {
  const bmr = bmrMifflin(profile.sex, profile.weightKg, profile.heightCm, profile.age);
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[profile.activityLevel]);
}

export function suggestCalories(profile: UserProfileData): number {
  if (profile.targetCalories) return profile.targetCalories;
  const tdee = calculateTDEE(profile);
  switch (profile.healthGoal) {
    case "fat_loss":
      return Math.round(tdee * 0.82);
    case "muscle_gain":
      return Math.round(tdee * 1.1);
    case "clean_eating":
      return tdee;
    default:
      return tdee;
  }
}

export function suggestMacros(profile: UserProfileData) {
  const calories = suggestCalories(profile);
  const protein = profile.targetProtein ?? Math.round(profile.weightKg * (profile.healthGoal === "muscle_gain" ? 2.0 : 1.6));
  const proteinCals = protein * 4;
  const remaining = Math.max(calories - proteinCals, 0);

  let fatRatio = 0.3;
  let carbRatio = 0.7;
  if (profile.healthGoal === "fat_loss") {
    fatRatio = 0.35;
    carbRatio = 0.65;
  } else if (profile.healthGoal === "muscle_gain") {
    fatRatio = 0.25;
    carbRatio = 0.75;
  }

  const fats = profile.targetFats ?? Math.round((remaining * fatRatio) / 9);
  const carbs = profile.targetCarbs ?? Math.round((remaining * carbRatio) / 4);
  const fiber = profile.targetFiber ?? 30;
  const sodium = profile.targetSodium ?? 2300;
  const sugar = profile.targetSugar ?? (profile.healthGoal === "fat_loss" ? 25 : 50);

  return { calories, protein, carbs, fats, fiber, sodium, sugar };
}

export function getEffectiveTargets(profile: UserProfileData) {
  return suggestMacros(profile);
}
