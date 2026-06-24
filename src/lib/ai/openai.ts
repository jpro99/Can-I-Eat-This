// src/lib/ai/openai.ts

import OpenAI from "openai";
import type { FoodAnalysis, PlateItem } from "@/types";
import { LABEL_OCR_PROMPT, PLATE_ANALYSIS_PROMPT, VOICE_MEAL_PROMPT } from "@/lib/ai/prompts";

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "sk-your-key-here") return null;
  return new OpenAI({ apiKey });
}

function getModel() {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

function parseJsonResponse<T>(text: string): T {
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(cleaned) as T;
}

export async function parseLabelWithAI(ocrText: string, imageBase64?: string): Promise<FoodAnalysis> {
  const client = getClient();
  if (!client) {
    return parseLabelFallback(ocrText);
  }

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "user",
      content: imageBase64
        ? [
            { type: "text", text: `${LABEL_OCR_PROMPT}\n\nOCR text:\n${ocrText}` },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ]
        : `${LABEL_OCR_PROMPT}\n\nOCR text:\n${ocrText}`,
    },
  ];

  const response = await client.chat.completions.create({
    model: getModel(),
    messages,
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = parseJsonResponse<{
    foodName: string;
    brand?: string;
    servingSize?: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    sugar?: number;
    fiber?: number;
    sodium?: number;
    ingredients: string;
    confidence: number;
  }>(content);

  return {
    foodName: parsed.foodName || "Scanned label",
    brand: parsed.brand,
    servingSize: parsed.servingSize || "1 serving",
    servings: 1,
    nutrition: {
      calories: parsed.calories || 0,
      protein: parsed.protein || 0,
      carbs: parsed.carbs || 0,
      fats: parsed.fats || 0,
      sugar: parsed.sugar ?? 0,
      fiber: parsed.fiber ?? 0,
      sodium: parsed.sodium ?? 0,
    },
    ingredients: parsed.ingredients || "",
    ingredientFlags: [],
    confidence: parsed.confidence ?? 0.75,
    isEstimated: true,
    sourceType: "label_ocr",
  };
}

export async function analyzePlatePhoto(imageBase64: string): Promise<FoodAnalysis> {
  const client = getClient();
  if (!client) {
    return plateFallback();
  }

  const response = await client.chat.completions.create({
    model: getModel(),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: PLATE_ANALYSIS_PROMPT },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        ],
      },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = parseJsonResponse<{
    mealName: string;
    confidence: number;
    items: PlateItem[];
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFats: number;
  }>(content);

  return {
    foodName: parsed.mealName || "Plate meal",
    servingSize: `${parsed.items?.length ?? 0} items`,
    servings: 1,
    nutrition: {
      calories: parsed.totalCalories || 0,
      protein: parsed.totalProtein || 0,
      carbs: parsed.totalCarbs || 0,
      fats: parsed.totalFats || 0,
    },
    ingredients: (parsed.items ?? []).map((i) => i.name).join(", "),
    ingredientFlags: [],
    confidence: parsed.confidence ?? 0.6,
    isEstimated: true,
    sourceType: "plate_ai",
    items: parsed.items ?? [],
  };
}

export async function parseVoiceMeal(transcript: string): Promise<FoodAnalysis> {
  const client = getClient();
  if (!client) {
    return voiceFallback(transcript);
  }

  const response = await client.chat.completions.create({
    model: getModel(),
    messages: [{ role: "user", content: `${VOICE_MEAL_PROMPT}\n\nTranscript: "${transcript}"` }],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = parseJsonResponse<{
    foodName: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    confidence: number;
    ingredients: string;
  }>(content);

  return {
    foodName: parsed.foodName || transcript,
    servingSize: "1 meal",
    servings: 1,
    nutrition: {
      calories: parsed.calories || 200,
      protein: parsed.protein || 10,
      carbs: parsed.carbs || 20,
      fats: parsed.fats || 8,
    },
    ingredients: parsed.ingredients || transcript,
    ingredientFlags: [],
    confidence: parsed.confidence ?? 0.65,
    isEstimated: true,
    sourceType: "voice",
  };
}

function parseLabelFallback(ocrText: string): FoodAnalysis {
  const calMatch = ocrText.match(/calories?\s*(\d+)/i);
  const proteinMatch = ocrText.match(/protein\s*(\d+\.?\d*)\s*g/i);
  return {
    foodName: "Scanned label",
    servingSize: "1 serving",
    servings: 1,
    nutrition: {
      calories: calMatch ? parseInt(calMatch[1], 10) : 0,
      protein: proteinMatch ? parseFloat(proteinMatch[1]) : 0,
      carbs: 0,
      fats: 0,
    },
    ingredients: ocrText.slice(0, 500),
    ingredientFlags: [],
    confidence: 0.5,
    isEstimated: true,
    sourceType: "label_ocr",
  };
}

function plateFallback(): FoodAnalysis {
  return {
    foodName: "Plate meal (demo)",
    servingSize: "1 plate",
    servings: 1,
    nutrition: { calories: 450, protein: 25, carbs: 40, fats: 18 },
    ingredients: "Mixed plate items",
    ingredientFlags: [],
    confidence: 0.4,
    isEstimated: true,
    sourceType: "plate_ai",
    items: [
      { id: "1", name: "Protein", portion: "1 serving", calories: 200, protein: 20, carbs: 0, fats: 8, confidence: 0.4 },
      { id: "2", name: "Carbs", portion: "1 serving", calories: 150, protein: 3, carbs: 30, fats: 2, confidence: 0.4 },
      { id: "3", name: "Vegetables", portion: "1 cup", calories: 100, protein: 2, carbs: 10, fats: 8, confidence: 0.4 },
    ],
  };
}

function voiceFallback(transcript: string): FoodAnalysis {
  return {
    foodName: transcript,
    servingSize: "1 meal",
    servings: 1,
    nutrition: { calories: 350, protein: 20, carbs: 30, fats: 12 },
    ingredients: transcript,
    ingredientFlags: [],
    confidence: 0.5,
    isEstimated: true,
    sourceType: "voice",
  };
}
