// src/lib/export/csv.ts

import type { MealLogItem } from "@/types";

export function generateCSV(meals: MealLogItem[]): string {
  const headers = [
    "Date",
    "Time",
    "Meal",
    "Food",
    "Brand",
    "Source",
    "Servings",
    "Calories",
    "Protein",
    "Carbs",
    "Fats",
    "Sugar",
    "Fiber",
    "Sodium",
    "Score",
    "Verdict",
    "Flags",
    "Estimated",
    "Confidence",
  ];

  const rows = meals.map((m) => [
    m.timestamp.slice(0, 10),
    m.timestamp.slice(11, 16),
    m.mealType,
    `"${m.foodName.replace(/"/g, '""')}"`,
    `"${(m.brand ?? "").replace(/"/g, '""')}"`,
    m.sourceType,
    m.servings.toString(),
    Math.round(m.calories).toString(),
    Math.round(m.protein).toString(),
    Math.round(m.carbs).toString(),
    Math.round(m.fats).toString(),
    Math.round(m.sugar).toString(),
    Math.round(m.fiber).toString(),
    Math.round(m.sodium).toString(),
    m.decisionScore.toString(),
    m.decisionVerdict,
    m.ingredientFlags.length.toString(),
    m.isEstimated ? "yes" : "no",
    m.confidence.toFixed(2),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
