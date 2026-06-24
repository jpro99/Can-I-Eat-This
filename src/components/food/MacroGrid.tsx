// src/components/food/MacroGrid.tsx

import type { NutritionFacts } from "@/types";

interface MacroGridProps {
  nutrition: NutritionFacts;
  servings?: number;
}

export function MacroGrid({ nutrition, servings = 1 }: MacroGridProps) {
  const s = servings;
  const primary = [
    { label: "Cal", value: Math.round(nutrition.calories * s) },
    { label: "Protein", value: `${Math.round(nutrition.protein * s)}g` },
    { label: "Carbs", value: `${Math.round(nutrition.carbs * s)}g` },
    { label: "Fat", value: `${Math.round(nutrition.fats * s)}g` },
  ];

  const secondary = [
    nutrition.fiber != null && nutrition.fiber > 0
      ? { label: "Fiber", value: `${Math.round(nutrition.fiber * s)}g` }
      : null,
    nutrition.sugar != null && nutrition.sugar > 0
      ? { label: "Sugar", value: `${Math.round(nutrition.sugar * s)}g` }
      : null,
    nutrition.sodium != null && nutrition.sodium > 0
      ? { label: "Sodium", value: `${Math.round(nutrition.sodium * s)}mg` }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="space-y-2">
      <div
        className="grid gap-2 text-center"
        style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
      >
        {primary.map((item) => (
          <div key={item.label} className="rounded-2xl bg-white/70 p-2 dark:bg-neutral-800/50">
            <p className="text-xs text-neutral-500">{item.label}</p>
            <p className="font-semibold">{item.value}</p>
          </div>
        ))}
      </div>
      {secondary.length > 0 && (
        <div className="grid grid-cols-3 gap-2 text-center">
          {secondary.map((item) => (
            <div key={item.label} className="rounded-2xl bg-neutral-50 p-2 dark:bg-neutral-800/30">
              <p className="text-xs text-neutral-500">{item.label}</p>
              <p className="text-sm font-medium">{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
