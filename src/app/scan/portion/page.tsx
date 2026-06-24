// src/app/scan/portion/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { FoodAnalysis, DecisionResult, PortionMethod } from "@/types";
import { SCAN_SESSION_KEY } from "@/lib/utils";
import { PORTION_OPTIONS, applyPortionMultiplier } from "@/lib/nutrition/portions";
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
  }, [router]);

  const reEvaluate = async () => {
    if (!analysis) return;
    setLoading(true);
    const base = {
      calories: analysis.nutrition.calories / (analysis.servings ?? 1),
      protein: analysis.nutrition.protein / (analysis.servings ?? 1),
      carbs: analysis.nutrition.carbs / (analysis.servings ?? 1),
      fats: analysis.nutrition.fats / (analysis.servings ?? 1),
      sodium: (analysis.nutrition.sodium ?? 0) / (analysis.servings ?? 1),
      sugar: (analysis.nutrition.sugar ?? 0) / (analysis.servings ?? 1),
      fiber: (analysis.nutrition.fiber ?? 0) / (analysis.servings ?? 1),
    };
    const adjusted = applyPortionMultiplier(base, method, servings);
    const mealContext = { ...getScanContext(), portionMethod: method, servings };
    const updatedAnalysis = {
      ...analysis,
      servings,
      mealContext,
      nutrition: { ...analysis.nutrition, ...adjusted },
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

  return (
    <AppShell hideNav>
      <Header title="Confirm portion" subtitle="Accuracy matters — pick what matches your plate" backHref="/scan/result" />

      <Card className="mb-4 space-y-4">
        <p className="font-medium">{analysis.foodName}</p>
        <div>
          <p className="mb-2 text-sm text-neutral-500">How did you measure?</p>
          <div className="space-y-2">
            {PORTION_OPTIONS.map((opt) => (
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
        </div>
        <div className="flex items-center justify-center gap-6">
          <Button variant="secondary" onClick={() => setServings(Math.max(0.25, servings - 0.25))}>−</Button>
          <div className="text-center">
            <p className="text-3xl font-bold">{servings}</p>
            <p className="text-xs text-neutral-500">servings</p>
          </div>
          <Button variant="secondary" onClick={() => setServings(servings + 0.25)}>+</Button>
        </div>
      </Card>

      <Button className="w-full" size="lg" disabled={loading} onClick={reEvaluate}>
        {loading ? "Updating advice…" : "Update my advice"}
      </Button>
    </AppShell>
  );
}
