// src/lib/barcode/open-food-facts.ts

import type { FoodAnalysis } from "@/types";

interface OFFProduct {
  product_name?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: Record<string, number | string>;
  ingredients_text?: string;
  image_front_url?: string;
}

export async function lookupBarcode(barcode: string): Promise<FoodAnalysis | null> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;

  const p = data.product as OFFProduct;
  const n = p.nutriments ?? {};

  const num = (key: string, fallback = 0) => {
    const val = n[key];
    return typeof val === "number" ? val : parseFloat(String(val)) || fallback;
  };

  return {
    foodName: p.product_name || "Unknown product",
    brand: p.brands?.split(",")[0]?.trim(),
    servingSize: p.serving_size || "1 serving",
    servings: 1,
    nutrition: {
      calories: num("energy-kcal_serving") || num("energy-kcal_100g") || 0,
      protein: num("proteins_serving") || num("proteins_100g") || 0,
      carbs: num("carbohydrates_serving") || num("carbohydrates_100g") || 0,
      fats: num("fat_serving") || num("fat_100g") || 0,
      saturatedFat: num("saturated-fat_serving") || num("saturated-fat_100g") || 0,
      sugar: num("sugars_serving") || num("sugars_100g") || 0,
      addedSugar: num("added-sugars_serving") || 0,
      fiber: num("fiber_serving") || num("fiber_100g") || 0,
      sodium: (num("sodium_serving") || num("sodium_100g") || 0) * 1000,
      cholesterol: num("cholesterol_serving") || num("cholesterol_100g") || 0,
    },
    ingredients: p.ingredients_text || "",
    ingredientFlags: [],
    confidence: 0.92,
    isEstimated: false,
    sourceType: "barcode",
    photoUrl: p.image_front_url,
    rawData: p,
  };
}
