// src/app/scan/manual/page.tsx

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import type { FoodAnalysis } from "@/types";
import { SCAN_SESSION_KEY } from "@/lib/utils";
import { getScanContext } from "@/lib/scan/context-storage";

export default function ManualSearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodAnalysis[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/food/search?q=${encodeURIComponent(q)}`);
    setResults(await res.json());
    setLoading(false);
  };

  const select = async (food: FoodAnalysis) => {
    const mealContext = getScanContext();
    const analysis = { ...food, sourceType: "manual" as const, mealContext };
    const res = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysis, mealContext }),
    });
    const data = await res.json();
    sessionStorage.setItem(SCAN_SESSION_KEY, JSON.stringify(data));
    router.push("/scan/result");
  };

  return (
    <AppShell hideNav>
      <Header title="Search food" backHref="/scan" />
      <Input
        placeholder="Search by name…"
        value={query}
        onChange={(e) => search(e.target.value)}
        autoFocus
      />
      <div className="mt-4 space-y-2">
        {loading && <p className="text-sm text-neutral-500">Searching…</p>}
        {results.map((food, i) => (
          <button key={i} type="button" onClick={() => select(food)} className="w-full text-left">
            <Card className="transition-transform active:scale-[0.99]">
              <h3 className="font-semibold">{food.foodName}</h3>
              {food.brand && <p className="text-sm text-neutral-500">{food.brand}</p>}
              <p className="mt-1 text-sm text-neutral-500">
                {Math.round(food.nutrition.calories)} cal · {Math.round(food.nutrition.protein)}g protein
              </p>
            </Card>
          </button>
        ))}
      </div>
    </AppShell>
  );
}
