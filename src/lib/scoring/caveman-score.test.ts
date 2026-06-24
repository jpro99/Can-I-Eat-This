// src/lib/scoring/caveman-score.test.ts

import { describe, it, expect } from "vitest";
import { calculateCavemanScore, scoreToVerdict } from "./caveman-score";
import type { FoodAnalysis, UserProfileData } from "@/types";

const baseProfile: UserProfileData = {
  id: "1",
  name: "Test",
  age: 30,
  sex: "male",
  heightCm: 180,
  weightKg: 80,
  activityLevel: "moderate",
  healthGoal: "fat_loss",
  strictness: "moderate",
  targetCalories: 2000,
  targetProtein: 150,
  targetCarbs: 200,
  targetFats: 65,
  targetFiber: 30,
  targetSodium: 2300,
  targetSugar: 25,
  allergies: [],
  foodsToAvoid: [],
  ingredientClassesToAvoid: [],
  avoidSeedOils: false,
  scoreEatThreshold: 80,
  scoreCautionThreshold: 55,
  supplements: [],
  avoidGmo: false,
  onboardingComplete: true,
  dailyRoutines: [],
  kitchenMemory: {
    setupComplete: false,
    pantryItems: [],
    appliances: [],
    venueOrders: [],
    spiceSets: [],
    mealTemplates: [],
  },
  waterVessels: [],
};

describe("Caveman Score", () => {
  it("scores high protein low sugar food well", () => {
    const analysis: FoodAnalysis = {
      foodName: "Grilled chicken",
      nutrition: { calories: 250, protein: 40, carbs: 0, fats: 8, sugar: 0, sodium: 200, fiber: 0 },
      ingredients: "Chicken breast",
      ingredientFlags: [],
      confidence: 0.9,
      isEstimated: false,
      sourceType: "manual",
    };
    const score = calculateCavemanScore(analysis, { profile: baseProfile });
    expect(score).toBeGreaterThanOrEqual(70);
    expect(scoreToVerdict(score, baseProfile)).toBe("eat");
  });

  it("scores flagged ingredients lower", () => {
    const analysis: FoodAnalysis = {
      foodName: "Candy",
      nutrition: { calories: 200, protein: 0, carbs: 50, fats: 0, sugar: 45, sodium: 50, fiber: 0 },
      ingredients: "Sugar, high fructose corn syrup, red 40",
      ingredientFlags: [
        { name: "HFCS", category: "sweetener", severity: "high", whyFlagged: "test" },
        { name: "Red 40", category: "artificial_dye", severity: "high", whyFlagged: "test" },
      ],
      confidence: 0.9,
      isEstimated: false,
      sourceType: "barcode",
    };
    const score = calculateCavemanScore(analysis, { profile: baseProfile });
    expect(score).toBeLessThan(80);
    expect(scoreToVerdict(score, baseProfile)).not.toBe("eat");
  });
});
