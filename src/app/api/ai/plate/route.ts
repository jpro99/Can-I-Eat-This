// src/app/api/ai/plate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { analyzePlatePhoto } from "@/lib/ai/openai";
import { evaluateAnalysis } from "@/lib/coach/evaluate";
import type { MealContext } from "@/types";

export async function POST(req: NextRequest) {
  const { imageBase64, mealContext } = await req.json();
  if (!imageBase64) {
    return NextResponse.json({ error: "Image required" }, { status: 400 });
  }

  const analysis = await analyzePlatePhoto(imageBase64);
  const result = await evaluateAnalysis({ ...analysis, mealContext }, mealContext as MealContext);
  return NextResponse.json(result);
}
