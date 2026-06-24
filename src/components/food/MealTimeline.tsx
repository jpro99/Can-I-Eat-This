// src/components/food/MealTimeline.tsx

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { MealLogItem } from "@/types";
import { formatDateTime, mealTypeLabel, verdictColor, cn } from "@/lib/utils";

interface MealTimelineProps {
  meals: MealLogItem[];
}

export function MealTimeline({ meals }: MealTimelineProps) {
  if (meals.length === 0) {
    return (
      <Card className="text-center">
        <p className="text-neutral-500">No food logged yet today.</p>
        <p className="mt-1 text-sm text-neutral-400">Tap Add to scan or log your first meal.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {meals.map((meal) => (
        <Link key={meal.id} href={`/meal/${meal.id}`}>
          <Card className="transition-transform active:scale-[0.99]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge>{mealTypeLabel(meal.mealType)}</Badge>
                  {meal.isEstimated && <Badge variant="caution">Estimated</Badge>}
                </div>
                <h3 className="mt-2 truncate font-semibold">{meal.foodName}</h3>
                <p className="text-sm text-neutral-500">{formatDateTime(meal.timestamp)}</p>
              </div>
              <div className="text-right">
                <p className={cn("text-lg font-bold", verdictColor(meal.decisionVerdict))}>
                  {meal.decisionScore}
                </p>
                <p className="text-sm text-neutral-500">{Math.round(meal.calories)} cal</p>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}