// src/app/api/food/search/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { FoodAnalysis } from "@/types";
import { parseMicronutrients } from "@/lib/nutrition/micronutrients";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json([]);

  const local = await prisma.foodCatalog.findMany({
    where: { name: { contains: q } },
    take: 10,
  });

  if (local.length > 0) {
    return NextResponse.json(
      local.map(
        (f): FoodAnalysis => ({
          foodName: f.name,
          brand: f.brand ?? undefined,
          servingSize: f.servingSize ?? "1 serving",
          servings: 1,
          nutrition: {
            calories: f.calories,
            protein: f.protein,
            carbs: f.carbs,
            fats: f.fats,
            saturatedFat: f.saturatedFat,
            sugar: f.sugar,
            addedSugar: f.addedSugar,
            fiber: f.fiber,
            sodium: f.sodium,
            cholesterol: f.cholesterol,
            micronutrients: parseMicronutrients(f.micronutrients),
          },
          ingredients: f.ingredients,
          ingredientFlags: [],
          confidence: 0.85,
          isEstimated: false,
          sourceType: "manual",
        })
      )
    );
  }

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=8`
    );
    const data = await res.json();
    const products = (data.products ?? []).map(
      (p: Record<string, unknown>): FoodAnalysis => ({
        foodName: String(p.product_name || "Unknown"),
        brand: p.brands ? String(p.brands).split(",")[0] : undefined,
        servingSize: String(p.serving_size || "1 serving"),
        servings: 1,
        nutrition: {
          calories: Number((p.nutriments as Record<string, number>)?.["energy-kcal_serving"] ?? 0),
          protein: Number((p.nutriments as Record<string, number>)?.proteins_serving ?? 0),
          carbs: Number((p.nutriments as Record<string, number>)?.carbohydrates_serving ?? 0),
          fats: Number((p.nutriments as Record<string, number>)?.fat_serving ?? 0),
        },
        ingredients: String(p.ingredients_text || ""),
        ingredientFlags: [],
        confidence: 0.8,
        isEstimated: false,
        sourceType: "manual",
      })
    );
    return NextResponse.json(products);
  } catch {
    return NextResponse.json([]);
  }
}
