// src/app/api/kitchen/pantry/scan/route.ts

import { NextRequest, NextResponse } from "next/server";
import { parseLabelWithAI } from "@/lib/ai/openai";
import { labelNutritionToPantryFields, pantryTypeRequiresLabel } from "@/lib/kitchen/pantry-label";
import type { PantryItemType } from "@/types";

export async function POST(req: NextRequest) {
  const { ocrText, imageBase64, pantryType } = (await req.json()) as {
    ocrText?: string;
    imageBase64?: string;
    pantryType: PantryItemType;
  };

  if (!ocrText && !imageBase64) {
    return NextResponse.json({ error: "Label photo required" }, { status: 400 });
  }

  if (!pantryType || !pantryTypeRequiresLabel(pantryType)) {
    return NextResponse.json({ error: "Invalid pantry type" }, { status: 400 });
  }

  const analysis = await parseLabelWithAI(ocrText || "", imageBase64);
  const fields = labelNutritionToPantryFields(
    {
      foodName: analysis.foodName,
      brand: analysis.brand,
      servingSize: analysis.servingSize,
      calories: analysis.nutrition.calories,
      protein: analysis.nutrition.protein,
      carbs: analysis.nutrition.carbs,
      fats: analysis.nutrition.fats,
      sugar: analysis.nutrition.sugar,
      sodium: analysis.nutrition.sodium,
    },
    pantryType
  );

  return NextResponse.json({
    ...fields,
    type: pantryType,
    confidence: analysis.confidence,
  });
}
