// src/app/meal/[id]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { MealLogItem } from "@/types";
import { formatDateTime, mealTypeLabel, verdictColor, verdictLabel } from "@/lib/utils";
import Link from "next/link";

export default function MealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [meal, setMeal] = useState<MealLogItem | null>(null);

  useEffect(() => {
    fetch(`/api/logs/${id}`)
      .then((r) => r.json())
      .then(setMeal);
  }, [id]);

  const remove = async () => {
    await fetch(`/api/logs/${id}`, { method: "DELETE" });
    router.push("/today");
  };

  if (!meal) return null;

  return (
    <AppShell hideNav>
      <Header title={meal.foodName} backHref="/today" />
      <Card>
        <div className="flex items-center justify-between">
          <Badge>{mealTypeLabel(meal.mealType)}</Badge>
          <span className={`text-2xl font-bold ${verdictColor(meal.decisionVerdict)}`}>
            {meal.decisionScore}
          </span>
        </div>
        <p className="mt-2 text-sm text-neutral-500">{formatDateTime(meal.timestamp)}</p>
        <Badge variant={meal.decisionVerdict} className="mt-3">{verdictLabel(meal.decisionVerdict)}</Badge>

        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-neutral-500">Calories</span><p className="font-semibold">{Math.round(meal.calories)}</p></div>
          <div><span className="text-neutral-500">Protein</span><p className="font-semibold">{Math.round(meal.protein)}g</p></div>
          <div><span className="text-neutral-500">Carbs</span><p className="font-semibold">{Math.round(meal.carbs)}g</p></div>
          <div><span className="text-neutral-500">Fat</span><p className="font-semibold">{Math.round(meal.fats)}g</p></div>
          <div><span className="text-neutral-500">Sugar</span><p className="font-semibold">{Math.round(meal.sugar)}g</p></div>
          <div><span className="text-neutral-500">Sodium</span><p className="font-semibold">{Math.round(meal.sodium)}mg</p></div>
        </div>

        {meal.isEstimated && (
          <p className="mt-4 text-xs text-neutral-500">
            Estimated · Confidence {Math.round(meal.confidence * 100)}%
          </p>
        )}

        {meal.decisionReasons.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium">Why</p>
            {meal.decisionReasons.map((r, i) => (
              <p key={i} className="text-sm text-neutral-600">• {r}</p>
            ))}
          </div>
        )}

        {meal.ingredientFlags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {meal.ingredientFlags.map((f) => (
              <Link key={f.name} href={`/ingredient/${encodeURIComponent(f.name.toLowerCase().replace(/\s+/g, "-"))}`}>
                <Badge variant="caution">{f.name}</Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Button variant="danger" className="mt-6 w-full" onClick={remove}>
        Delete from log
      </Button>
    </AppShell>
  );
}
