// src/app/api/ocr/label/route.ts

import { NextRequest, NextResponse } from "next/server";
import { parseLabelWithAI } from "@/lib/ai/openai";
import { evaluateAnalysis } from "@/lib/coach/evaluate";
import type { MealContext } from "@/types";

export async function POST(req: NextRequest) {
  const { ocrText, imageBase64, mealContext } = await req.json();
  if (!ocrText && !imageBase64) {
    return NextResponse.json({ error: "OCR text or image required" }, { status: 400 });
  }

  const analysis = await parseLabelWithAI(ocrText || "", imageBase64);
  const result = await evaluateAnalysis({ ...analysis, mealContext }, mealContext as MealContext);
  return NextResponse.json(result);
}
