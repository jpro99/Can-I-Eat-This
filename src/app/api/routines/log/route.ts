// src/app/api/routines/log/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getOrCreateProfile, prisma } from "@/lib/db";
import { mapProfile, profileToDbFields } from "@/lib/profile/mapper";
import {
  buildRoutineIngredients,
  calculateRoutineNutrition,
  describeRoutineServing,
} from "@/lib/routines/calculator";
import { detectMealType } from "@/lib/utils";
import type { DailyRoutine } from "@/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { routineId, modifierLevels, saveAsDefault, mealType } = body as {
    routineId: string;
    modifierLevels?: Record<string, number>;
    saveAsDefault?: boolean;
    mealType?: string;
  };

  const profile = mapProfile(await getOrCreateProfile());
  const routine = profile.dailyRoutines.find((r) => r.id === routineId);
  if (!routine) {
    return NextResponse.json({ error: "Routine not found" }, { status: 404 });
  }

  const levels = { ...routine.defaults, ...modifierLevels };
  const nutrition = calculateRoutineNutrition(routine, levels);
  const servingSize = describeRoutineServing(routine, levels);
  const ingredients = buildRoutineIngredients(routine, levels);

  if (saveAsDefault) {
    const updatedRoutines: DailyRoutine[] = profile.dailyRoutines.map((r) =>
      r.id === routineId ? { ...r, defaults: levels } : r
    );
    await prisma.userProfile.update({
      where: { id: profile.id },
      data: profileToDbFields({ dailyRoutines: updatedRoutines }),
    });
  }

  const log = await prisma.mealLog.create({
    data: {
      profileId: profile.id,
      mealType: mealType ?? routine.mealType ?? detectMealType(),
      sourceType: "routine",
      foodName: routine.name,
      servings: 1,
      servingSize,
      confidence: 0.95,
      isEstimated: true,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fats: nutrition.fats,
      sugar: nutrition.sugar ?? 0,
      fiber: nutrition.fiber ?? 0,
      sodium: nutrition.sodium ?? 0,
      ingredients,
      ingredientFlags: "[]",
      decisionScore: 85,
      decisionVerdict: "eat",
      decisionReasons: JSON.stringify(["Logged from your saved daily routine"]),
      forYouSummary: `Logged your ${routine.name.toLowerCase()} — ${servingSize}.`,
    },
  });

  return NextResponse.json({
    log,
    nutrition,
    servingSize,
  });
}
