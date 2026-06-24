// src/lib/ai/prompts.ts

export const LABEL_OCR_PROMPT = `You are a nutrition label parser. Extract structured data from the nutrition facts label and ingredients list.
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

export const PLATE_ANALYSIS_PROMPT = `You are a meal photo analyzer. Identify visible food items on the plate and estimate portions.
IMPORTANT: These are ESTIMATES, not exact values. Be conservative and include confidence per item.
Return JSON only:
{
  "mealName": string,
  "confidence": number (0-1),
  "items": [
    {
      "id": string,
      "name": string,
      "portion": string,
      "calories": number,
      "protein": number,
      "carbs": number,
      "fats": number,
      "confidence": number
    }
  ],
  "totalCalories": number,
  "totalProtein": number,
  "totalCarbs": number,
  "totalFats": number
}`;

export const VOICE_MEAL_PROMPT = `Parse the spoken meal description into structured nutrition estimates.
Return JSON only:
{
  "foodName": string,
  "calories": number,
  "protein": number,
  "carbs": number,
  "fats": number,
  "ingredients": string,
  "confidence": number (0-1)
}
Use reasonable USDA-style estimates. Mark confidence lower for vague descriptions.`;
