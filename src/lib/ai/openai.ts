// src/lib/ai/openai.ts

import OpenAI from "openai";
import type { FoodAnalysis, MealContext, PlateItem } from "@/types";
import { LABEL_OCR_PROMPT, plateAnalysisPromptWithContext, VOICE_MEAL_PROMPT, CUP_VOLUME_PROMPT } from "@/lib/ai/prompts";

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

export async function analyzePlatePhoto(imageBase64: string, mealContext?: MealContext): Promise<FoodAnalysis> {
  const client = getClient();
  if (!client) {
    return plateFallback(mealContext);
  }

  const prompt = plateAnalysisPromptWithContext(mealContext?.mealOrigin, mealContext?.restaurantName);

  const response = await client.chat.completions.create({
    model: getModel(),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
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
    totalFiber?: number;
    totalSugar?: number;
    totalSodium?: number;
  }>(content);

  const items = parsed.items ?? [];
  const sumField = (key: keyof PlateItem) =>
    items.reduce((acc, i) => acc + (Number(i[key]) || 0), 0);

  const nutrition = {
    calories: parsed.totalCalories || sumField("calories"),
    protein: parsed.totalProtein || sumField("protein"),
    carbs: parsed.totalCarbs || sumField("carbs"),
    fats: parsed.totalFats || sumField("fats"),
    fiber: parsed.totalFiber ?? sumField("fiber"),
    sugar: parsed.totalSugar ?? sumField("sugar"),
    sodium: parsed.totalSodium ?? sumField("sodium"),
  };

  return {
    foodName: parsed.mealName || "Plate meal",
    servingSize: items.length > 0 ? `${items.length} items detected` : "1 plate",
    servings: 1,
    nutrition,
    ingredients: items.map((i) => i.name).join(", "),
    ingredientFlags: [],
    confidence: parsed.confidence ?? 0.6,
    isEstimated: true,
    sourceType: "plate_ai",
    items,
    mealContext,
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

function plateFallback(mealContext?: MealContext): FoodAnalysis {
  const isRestaurant = mealContext?.mealOrigin === "restaurant";
  const items: PlateItem[] = [
    {
      id: "1",
      name: isRestaurant ? "Grilled protein" : "Chicken breast",
      portion: isRestaurant ? "6 oz" : "4 oz",
      calories: isRestaurant ? 280 : 185,
      protein: isRestaurant ? 42 : 35,
      carbs: 0,
      fats: isRestaurant ? 12 : 4,
      fiber: 0,
      sugar: 0,
      sodium: isRestaurant ? 520 : 75,
      confidence: 0.4,
    },
    {
      id: "2",
      name: "Rice or potatoes",
      portion: "1 cup",
      calories: 200,
      protein: 4,
      carbs: 44,
      fats: 0.5,
      fiber: 1,
      sugar: 0,
      sodium: isRestaurant ? 380 : 10,
      confidence: 0.4,
    },
    {
      id: "3",
      name: "Vegetables",
      portion: "1 cup",
      calories: 55,
      protein: 3,
      carbs: 10,
      fats: 0.5,
      fiber: 4,
      sugar: 4,
      sodium: isRestaurant ? 290 : 35,
      confidence: 0.4,
    },
  ];

  const nutrition = items.reduce(
    (acc, i) => ({
      calories: acc.calories + i.calories,
      protein: acc.protein + i.protein,
      carbs: acc.carbs + i.carbs,
      fats: acc.fats + i.fats,
      fiber: (acc.fiber ?? 0) + (i.fiber ?? 0),
      sugar: (acc.sugar ?? 0) + (i.sugar ?? 0),
      sodium: (acc.sodium ?? 0) + (i.sodium ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, sodium: 0 }
  );

  return {
    foodName: isRestaurant ? "Restaurant plate (demo)" : "Plate meal (demo)",
    servingSize: "3 items detected",
    servings: 1,
    nutrition,
    ingredients: items.map((i) => i.name).join(", "),
    ingredientFlags: [],
    confidence: 0.4,
    isEstimated: true,
    sourceType: "plate_ai",
    items,
    mealContext,
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

export async function analyzeCupVolume(imageBase64: string): Promise<{
  estimatedFlOz: number;
  cupDescription: string;
  confidence: number;
}> {
  const client = getClient();
  if (!client) {
    return { estimatedFlOz: 8, cupDescription: "Standard glass", confidence: 0.3 };
  }

  const response = await client.chat.completions.create({
    model: getModel(),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: CUP_VOLUME_PROMPT },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        ],
      },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = parseJsonResponse<{
    estimatedFlOz: number;
    cupDescription: string;
    confidence: number;
  }>(content);

  return {
    estimatedFlOz: Math.max(4, Math.min(64, parsed.estimatedFlOz || 8)),
    cupDescription: parsed.cupDescription || "My cup",
    confidence: parsed.confidence ?? 0.5,
  };
}
