// src/app/scan/portion/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MacroGrid } from "@/components/food/MacroGrid";
import type { FoodAnalysis, DecisionResult, PortionMethod } from "@/types";
import { SCAN_SESSION_KEY } from "@/lib/utils";
import {
  PORTION_GROUPS,
  applyPortionMultiplier,
  defaultPortionMethod,
  scalePlateItems,
} from "@/lib/nutrition/portions";
import { getScanContext } from "@/lib/scan/context-storage";

export default function PortionPage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [decision, setDecision] = useState<DecisionResult | null>(null);
  const [method, setMethod] = useState<PortionMethod>("default");
  const [servings, setServings] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(SCAN_SESSION_KEY);
    if (!raw) {
      router.replace("/scan");
      return;
    }
    const data = JSON.parse(raw);
    setAnalysis(data.analysis);
    setDecision(data.decision);
    setServings(data.analysis.servings ?? 1);
    const ctx = data.analysis.mealContext ?? getScanContext();
    setMethod(defaultPortionMethod(ctx?.mealOrigin));
  }, [router]);

  const previewNutrition = () => {
    if (!analysis) return null;
    const divisor = analysis.servings ?? 1;
    const base = {
      calories: analysis.nutrition.calories / divisor,
      protein: analysis.nutrition.protein / divisor,
      carbs: analysis.nutrition.carbs / divisor,
      fats: analysis.nutrition.fats / divisor,
      sodium: (analysis.nutrition.sodium ?? 0) / divisor,
      sugar: (analysis.nutrition.sugar ?? 0) / divisor,
      fiber: (analysis.nutrition.fiber ?? 0) / divisor,
    };
    return applyPortionMultiplier(base, method, servings);
  };

  const reEvaluate = async () => {
    if (!analysis) return;
    setLoading(true);
    const divisor = analysis.servings ?? 1;
    const base = {
      calories: analysis.nutrition.calories / divisor,
      protein: analysis.nutrition.protein / divisor,
      carbs: analysis.nutrition.carbs / divisor,
      fats: analysis.nutrition.fats / divisor,
      sodium: (analysis.nutrition.sodium ?? 0) / divisor,
      sugar: (analysis.nutrition.sugar ?? 0) / divisor,
      fiber: (analysis.nutrition.fiber ?? 0) / divisor,
    };
    const adjusted = applyPortionMultiplier(base, method, servings);
    const mealContext = { ...getScanContext(), ...analysis.mealContext, portionMethod: method, servings };
    const scaledItems = analysis.items?.length
      ? scalePlateItems(analysis.items, method, servings)
      : undefined;

    const updatedAnalysis = {
      ...analysis,
      servings,
      mealContext,
      nutrition: { ...analysis.nutrition, ...adjusted },
      items: scaledItems ?? analysis.items,
    };

    const res = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysis: updatedAnalysis, mealContext }),
    });

    if (res.ok) {
      const result = await res.json();
      sessionStorage.setItem(SCAN_SESSION_KEY, JSON.stringify(result));
    } else {
      sessionStorage.setItem(
        SCAN_SESSION_KEY,
        JSON.stringify({ analysis: updatedAnalysis, decision })
      );
    }
    router.push("/scan/result");
  };

  if (!analysis) return null;

  const preview = previewNutrition();

  return (
    <AppShell hideNav>
      <Header title="Adjust portion" subtitle="Cups, oz, restaurant sizes — pick what matches" backHref="/scan/result" />

      <Card className="mb-4 space-y-4">
        <p className="font-medium">{analysis.foodName}</p>
        {preview && (
          <div>
            <p className="mb-2 text-sm text-neutral-500">Updated totals</p>
            <MacroGrid nutrition={preview} servings={1} />
          </div>
        )}
      </Card>

      {PORTION_GROUPS.map((group) => (
        <Card key={group.title} className="mb-3 space-y-2">
          <p className="text-sm font-medium text-neutral-500">{group.title}</p>
          <div className="space-y-2">
            {group.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMethod(opt.id)}
                className={`w-full rounded-2xl border p-3 text-left ${method === opt.id ? "border-neutral-900 bg-neutral-50" : "border-neutral-200"}`}
              >
                <p className="font-medium">{opt.label}</p>
                <p className="text-xs text-neutral-500">{opt.desc}</p>
              </button>
            ))}
          </div>
        </Card>
      ))}

      <Card className="mb-4">
        <p className="mb-3 text-sm text-neutral-500">Fine-tune amount</p>
        <div className="flex items-center justify-center gap-6">
          <Button variant="secondary" onClick={() => setServings(Math.max(0.25, servings - 0.25))}>−</Button>
          <div className="text-center">
            <p className="text-3xl font-bold">{servings}</p>
            <p className="text-xs text-neutral-500">× multiplier</p>
          </div>
          <Button variant="secondary" onClick={() => setServings(servings + 0.25)}>+</Button>
        </div>
      </Card>

      <Button className="w-full" size="lg" disabled={loading} onClick={reEvaluate}>
        {loading ? "Updating advice…" : "Apply & see result"}
      </Button>
    </AppShell>
  );
}
