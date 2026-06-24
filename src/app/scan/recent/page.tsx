// src/app/scan/recent/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import type { MealLogItem } from "@/types";
import { detectMealType } from "@/lib/utils";

export default function RecentMealsPage() {
  const router = useRouter();
  const [meals, setMeals] = useState<MealLogItem[]>([]);

  useEffect(() => {
    fetch("/api/logs")
      .then((r) => r.json())
      .then(setMeals);
  }, []);

  const repeat = async (meal: MealLogItem) => {
    const analysis = {
      foodName: meal.foodName,
      brand: meal.brand,
      servingSize: meal.servingSize,
      servings: meal.servings,
      nutrition: {
        calories: meal.calories / meal.servings,
        protein: meal.protein / meal.servings,
        carbs: meal.carbs / meal.servings,
        fats: meal.fats / meal.servings,
        sugar: meal.sugar / meal.servings,
        fiber: meal.fiber / meal.servings,
        sodium: meal.sodium / meal.servings,
      },
      ingredients: meal.ingredients,
      ingredientFlags: meal.ingredientFlags,
      confidence: meal.confidence,
      isEstimated: meal.isEstimated,
      sourceType: "repeat" as const,
    };
    await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        analysis,
        decision: {
          score: meal.decisionScore,
          verdict: meal.decisionVerdict,
          reasons: meal.decisionReasons,
          positives: [],
          negatives: [],
        },
        mealType: detectMealType(),
      }),
    });
    router.push("/today");
  };

  const unique = [...new Map(meals.map((m) => [m.foodName, m])).values()];

  return (
    <AppShell hideNav>
      <Header title="Repeat meal" subtitle="One tap to log again" backHref="/scan" />
      <div className="space-y-3">
        {unique.length === 0 && (
          <Card><p className="text-neutral-500">No recent meals yet.</p></Card>
        )}
        {unique.map((meal) => (
          <button key={meal.id} type="button" onClick={() => repeat(meal)} className="w-full text-left">
            <Card className="transition-transform active:scale-[0.99]">
              <h3 className="font-semibold">{meal.foodName}</h3>
              <p className="text-sm text-neutral-500">
                {Math.round(meal.calories)} cal · Last {new Date(meal.timestamp).toLocaleDateString()}
              </p>
            </Card>
          </button>
        ))}
      </div>
    </AppShell>
  );
}
