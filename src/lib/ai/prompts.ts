// src/lib/ai/prompts.ts

export const LABEL_OCR_PROMPT = `You are a nutrition label parser for US products. Extract structured data from the nutrition facts label and ingredients list.
Return JSON only with these fields:
{
  "foodName": string,
  "brand": string | null,
  "servingSize": string,
  "calories": number,
  "protein": number,
  "carbs": number,
  "fats": number,
  "sugar": number,
  "fiber": number,
  "sodium": number (mg),
  "ingredients": string (full ingredient list),
  "confidence": number (0-1)
}
Use 0 for unknown values. Be conservative with confidence.`;

export const PLATE_ANALYSIS_PROMPT = `You are a US nutrition expert analyzing a meal photo. Identify every visible food item and estimate nutrition using USDA-style reference values.

IMPORTANT:
- Use US customary portions in your estimates: cups, fl oz, tablespoons, ounces (oz), slices, pieces.
- These are ESTIMATES from a photo — be conservative. Restaurant portions are often 1.5–2× standard serving sizes.
- Return per-item macros in grams (g) for protein, carbs, fat, fiber, sugar. Sodium in mg.
- Sum item totals into the meal totals. Totals must match the sum of items.

Return JSON only:
{
  "mealName": string,
  "confidence": number (0-1),
  "items": [
    {
      "id": string,
      "name": string,
      "portion": string (US units, e.g. "1 cup white rice", "6 oz grilled chicken", "2 tbsp ranch"),
      "calories": number,
      "protein": number (g),
      "carbs": number (g),
      "fats": number (g),
      "fiber": number (g),
      "sugar": number (g),
      "sodium": number (mg),
      "confidence": number (0-1)
    }
  ],
  "totalCalories": number,
  "totalProtein": number,
  "totalCarbs": number,
  "totalFats": number,
  "totalFiber": number,
  "totalSugar": number,
  "totalSodium": number
}`;

export function plateAnalysisPromptWithContext(mealOrigin?: string, restaurantName?: string): string {
  let context = PLATE_ANALYSIS_PROMPT;
  if (mealOrigin === "restaurant") {
    context += `\n\nContext: This is a RESTAURANT meal${restaurantName ? ` from ${restaurantName}` : ""}. Assume larger portions, extra oil/butter, and higher sodium than homemade.`;
  } else if (mealOrigin === "homemade") {
    context += `\n\nContext: This is a HOMEMADE meal. Portions may be more standard than restaurant food.`;
  }
  return context;
}

export const VOICE_MEAL_PROMPT = `Parse the spoken meal description into structured nutrition estimates using US serving sizes where helpful.
Return JSON only:
{
  "foodName": string,
  "calories": number,
  "protein": number,
  "carbs": number,
  "fats": number,
  "fiber": number,
  "sugar": number,
  "sodium": number (mg),
  "ingredients": string,
  "confidence": number (0-1)
}
Use reasonable USDA-style estimates. Mark confidence lower for vague descriptions.`;

export const CUP_VOLUME_PROMPT = `You are helping estimate how much liquid a drinking cup or glass holds when photographed.
Look at the cup/glass/mug in the photo. Estimate its typical fill volume in US fluid ounces (fl oz).
Return JSON only:
{
  "estimatedFlOz": number,
  "cupDescription": string (e.g. "tall kitchen glass", "coffee mug"),
  "confidence": number (0-1)
}
Be conservative. If unsure, estimate 8 fl oz for a standard glass.`;
