// src/app/api/logs/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getOrCreateProfile, prisma } from "@/lib/db";
import { mapProfile } from "@/lib/profile/mapper";
import { analyzeIngredients } from "@/lib/ingredients/flags";
import { evaluateAnalysis } from "@/lib/coach/evaluate";
import { mapMealLog } from "@/lib/nutrition/aggregates";
import { detectMealType } from "@/lib/utils";
import type { FoodAnalysis, MealContext } from "@/types";

export async function GET(req: NextRequest) {
  const profile = await getOrCreateProfile();
  const start = req.nextUrl.searchParams.get("start");
  const end = req.nextUrl.searchParams.get("end");

  const where: { profileId: string; timestamp?: { gte: Date; lte: Date } } = { profileId: profile.id };
  if (start && end) {
    where.timestamp = { gte: new Date(start), lte: new Date(end) };
  }

  const logs = await prisma.mealLog.findMany({
    where,
    orderBy: { timestamp: "desc" },
  });

  return NextResponse.json(logs.map(mapMealLog));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const profile = mapProfile(await getOrCreateProfile());

  const analysis: FoodAnalysis = body.analysis;
  const mealContext: MealContext | undefined = body.mealContext ?? analysis.mealContext;
  const flags = analysis.ingredientFlags.length
    ? analysis.ingredientFlags
    : analyzeIngredients(analysis.ingredients, profile);

  const decision = body.decision ?? (await evaluateAnalysis({ ...analysis, ingredientFlags: flags, mealContext }, mealContext)).decision;

  const servings = analysis.servings ?? 1;
  const micro = analysis.nutrition.micronutrients ?? {};

  const log = await prisma.mealLog.create({
    data: {
      profileId: profile.id,
      mealType: body.mealType ?? detectMealType(),
      mealOrigin: mealContext?.mealOrigin ?? null,
      restaurantName: mealContext?.restaurantName ?? null,
      portionMethod: mealContext?.portionMethod ?? null,
      sourceType: analysis.sourceType,
      foodName: analysis.foodName,
      brand: analysis.brand,
      servings,
      servingSize: analysis.servingSize,
      photoUrl: analysis.photoUrl,
      confidence: analysis.confidence,
      isEstimated: analysis.isEstimated,
      calories: analysis.nutrition.calories * servings,
      protein: analysis.nutrition.protein * servings,
      carbs: analysis.nutrition.carbs * servings,
      fats: analysis.nutrition.fats * servings,
      saturatedFat: (analysis.nutrition.saturatedFat ?? 0) * servings,
      sugar: (analysis.nutrition.sugar ?? 0) * servings,
      addedSugar: (analysis.nutrition.addedSugar ?? 0) * servings,
      fiber: (analysis.nutrition.fiber ?? 0) * servings,
      sodium: (analysis.nutrition.sodium ?? 0) * servings,
      cholesterol: (analysis.nutrition.cholesterol ?? 0) * servings,
      micronutrients: JSON.stringify(
        Object.fromEntries(Object.entries(micro).map(([k, v]) => [k, (v as number) * servings]))
      ),
      ingredients: analysis.ingredients,
      ingredientFlags: JSON.stringify(flags),
      decisionScore: decision.score,
      decisionVerdict: decision.verdict,
      decisionReasons: JSON.stringify(decision.reasons),
      forYouSummary: decision.forYouSummary ?? null,
      rawData: analysis.rawData ? JSON.stringify(analysis.rawData) : null,
    },
  });

  return NextResponse.json(mapMealLog(log));
}
