// src/components/food/PlateBreakdown.tsx

import { Card } from "@/components/ui/Card";
import type { PlateItem } from "@/types";

interface PlateBreakdownProps {
  items: PlateItem[];
  servings?: number;
}

export function PlateBreakdown({ items, servings = 1 }: PlateBreakdownProps) {
  if (items.length === 0) return null;

  return (
    <Card className="space-y-3">
      <div>
        <h3 className="font-semibold">What we detected</h3>
        <p className="text-sm text-neutral-500">Per-item estimates from your photo — adjust portions if needed</p>
      </div>
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-neutral-100 p-3 dark:border-neutral-800">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-neutral-500">{item.portion}</p>
            </div>
            <span className="shrink-0 text-xs text-neutral-400">{Math.round(item.confidence * 100)}% sure</span>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1 text-center text-xs">
            <div>
              <p className="text-neutral-400">Cal</p>
              <p className="font-semibold">{Math.round(item.calories * servings)}</p>
            </div>
            <div>
              <p className="text-neutral-400">Protein</p>
              <p className="font-semibold">{Math.round(item.protein * servings)}g</p>
            </div>
            <div>
              <p className="text-neutral-400">Carbs</p>
              <p className="font-semibold">{Math.round(item.carbs * servings)}g</p>
            </div>
            <div>
              <p className="text-neutral-400">Fat</p>
              <p className="font-semibold">{Math.round(item.fats * servings)}g</p>
            </div>
          </div>
          {(item.fiber || item.sugar || item.sodium) ? (
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-neutral-500">
              {item.fiber != null && item.fiber > 0 && <span>Fiber {Math.round(item.fiber * servings)}g</span>}
              {item.sugar != null && item.sugar > 0 && <span>Sugar {Math.round(item.sugar * servings)}g</span>}
              {item.sodium != null && item.sodium > 0 && <span>Sodium {Math.round(item.sodium * servings)}mg</span>}
            </div>
          ) : null}
        </div>
      ))}
    </Card>
  );
}
