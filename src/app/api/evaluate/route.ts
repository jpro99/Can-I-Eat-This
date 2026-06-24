// src/app/api/evaluate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { evaluateAnalysis } from "@/lib/coach/evaluate";
import type { FoodAnalysis, MealContext } from "@/types";

export async function POST(req: NextRequest) {
  const { analysis, mealContext } = await req.json() as { analysis: FoodAnalysis; mealContext?: MealContext };
  if (!analysis) {
    return NextResponse.json({ error: "Analysis required" }, { status: 400 });
  }
  const result = await evaluateAnalysis(analysis, mealContext);
  return NextResponse.json(result);
}
