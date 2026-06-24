// src/app/scan/result/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { DecisionCard } from "@/components/food/DecisionCard";
import { PlateBreakdown } from "@/components/food/PlateBreakdown";
import { Button } from "@/components/ui/Button";
import type { FoodAnalysis, DecisionResult, RestaurantInfo } from "@/types";
import { SCAN_SESSION_KEY, detectMealType } from "@/lib/utils";
import { getScanContext } from "@/lib/scan/context-storage";
import Link from "next/link";

export default function ScanResultPage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [decision, setDecision] = useState<DecisionResult | null>(null);
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(SCAN_SESSION_KEY);
    if (!raw) {
      router.replace("/scan");
      return;
    }
    const data = JSON.parse(raw);
    setAnalysis(data.analysis);
    setDecision(data.decision);
    setRestaurant(data.restaurant ?? null);
  }, [router]);

  const save = async () => {
    if (!analysis || !decision) return;
    setSaving(true);
    const mealContext = getScanContext();
    await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        analysis: { ...analysis, mealContext: { ...mealContext, ...analysis.mealContext } },
        decision,
        mealContext,
        mealType: detectMealType(),
      }),
    });
    sessionStorage.removeItem(SCAN_SESSION_KEY);
    router.push("/today");
  };

  if (!analysis || !decision) return null;

  const isPlate = analysis.sourceType === "plate_ai";

  return (
    <AppShell hideNav>
      <Header title={isPlate ? "Meal analysis" : "Result"} backHref="/scan" />
      <DecisionCard analysis={analysis} decision={decision} restaurant={restaurant} />

      {analysis.items && analysis.items.length > 0 && (
        <div className="mt-4">
          <PlateBreakdown items={analysis.items} servings={analysis.servings ?? 1} />
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Link href="/scan/portion" className="flex-1">
          <Button variant="secondary" className="w-full">
            {isPlate ? "Adjust cups & portions" : "Edit portion"}
          </Button>
        </Link>
        <Button className="flex-1" disabled={saving} onClick={save}>
          {saving ? "Saving…" : "Save to log"}
        </Button>
      </div>
    </AppShell>
  );
}
