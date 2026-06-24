// src/app/api/ai/voice/route.ts

import { NextRequest, NextResponse } from "next/server";
import { parseVoiceMeal } from "@/lib/ai/openai";
import { evaluateAnalysis } from "@/lib/coach/evaluate";
import type { MealContext } from "@/types";

export async function POST(req: NextRequest) {
  const { transcript, mealContext } = await req.json();
  if (!transcript) {
    return NextResponse.json({ error: "Transcript required" }, { status: 400 });
  }

  const analysis = await parseVoiceMeal(transcript);
  const result = await evaluateAnalysis({ ...analysis, mealContext }, mealContext as MealContext);
  return NextResponse.json(result);
}
