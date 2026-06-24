// src/lib/routines/defaults.ts

import type { DailyRoutine } from "@/types";

export const DEFAULT_DAILY_ROUTINES: DailyRoutine[] = [
  {
    id: "morning-coffee",
    name: "Morning coffee",
    emoji: "☕",
    mealType: "breakfast",
    showInMorning: true,
    servingDescription: "12 oz coffee",
    base: { calories: 5, protein: 0.3, carbs: 0, fats: 0, sugar: 0, sodium: 5 },
    modifiers: [
      {
        id: "cream",
        label: "Cream",
        unit: "tbsp",
        maxUnits: 3,
        caloriesPerUnit: 52,
        proteinPerUnit: 0.3,
        carbsPerUnit: 0.4,
        fatsPerUnit: 5.5,
        sugarPerUnit: 0.4,
      },
      {
        id: "milk",
        label: "Milk",
        unit: "tbsp",
        maxUnits: 4,
        caloriesPerUnit: 9,
        proteinPerUnit: 0.5,
        carbsPerUnit: 0.7,
        fatsPerUnit: 0.5,
        sugarPerUnit: 0.7,
      },
    ],
    defaults: { cream: 33, milk: 50 },
  },
  {
    id: "hot-sauce",
    name: "Hot sauce",
    emoji: "🌶️",
    mealType: "snack",
    showInMorning: false,
    servingDescription: "Added to a meal",
    base: { calories: 0, protein: 0, carbs: 0, fats: 0, sugar: 0, sodium: 0 },
    modifiers: [
      {
        id: "amount",
        label: "Hot sauce",
        unit: "tsp",
        maxUnits: 6,
        caloriesPerUnit: 1,
        proteinPerUnit: 0,
        carbsPerUnit: 0.2,
        fatsPerUnit: 0,
        sugarPerUnit: 0.1,
        sodiumPerUnit: 35,
      },
    ],
    defaults: { amount: 33 },
  },
];
