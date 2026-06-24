// src/app/scan/serving/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { FoodAnalysis, DecisionResult } from "@/types";
import { SCAN_SESSION_KEY } from "@/lib/utils";

export default function ServingCorrectionPage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [decision, setDecision] = useState<DecisionResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(SCAN_SESSION_KEY);
    if (!raw) {
      router.replace("/scan");
      return;
    }
    const data = JSON.parse(raw);
    setAnalysis(data.analysis);
    setDecision(data.decision);
  }, [router]);

  if (!analysis) return null;

  const updateServings = (servings: number) => {
    const updated = { ...analysis, servings };
    setAnalysis(updated);
    sessionStorage.setItem(SCAN_SESSION_KEY, JSON.stringify({ analysis: updated, decision }));
  };

  return (
    <AppShell hideNav>
      <Header title="Edit serving" backHref="/scan/result" />
      <Card className="space-y-4">
        <Input
          placeholder="Food name"
          value={analysis.foodName}
          onChange={(e) => setAnalysis({ ...analysis, foodName: e.target.value })}
        />
        <div>
          <p className="mb-2 text-sm font-medium text-neutral-500">Servings</p>
          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={() => updateServings(Math.max(0.25, (analysis.servings ?? 1) - 0.25))}>−</Button>
            <span className="text-2xl font-semibold">{analysis.servings ?? 1}</span>
            <Button variant="secondary" onClick={() => updateServings((analysis.servings ?? 1) + 0.25)}>+</Button>
          </div>
        </div>
        <Input
          placeholder="Serving size"
          value={analysis.servingSize ?? ""}
          onChange={(e) => setAnalysis({ ...analysis, servingSize: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            placeholder="Calories"
            value={analysis.nutrition.calories}
            onChange={(e) =>
              setAnalysis({
                ...analysis,
                nutrition: { ...analysis.nutrition, calories: parseFloat(e.target.value) || 0 },
              })
            }
          />
          <Input
            type="number"
            placeholder="Protein (g)"
            value={analysis.nutrition.protein}
            onChange={(e) =>
              setAnalysis({
                ...analysis,
                nutrition: { ...analysis.nutrition, protein: parseFloat(e.target.value) || 0 },
              })
            }
          />
        </div>
      </Card>
      <Button
        className="mt-6 w-full"
        onClick={() => {
          sessionStorage.setItem(SCAN_SESSION_KEY, JSON.stringify({ analysis, decision }));
          router.push("/scan/result");
        }}
      >
        Done
      </Button>
    </AppShell>
  );
}
