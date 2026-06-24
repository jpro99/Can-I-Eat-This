// src/app/history/page.tsx

"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { HistorySummary } from "@/types";

const ranges = [
  { id: "1", label: "Today" },
  { id: "7", label: "7 days" },
  { id: "30", label: "30 days" },
];

export default function HistoryPage() {
  const [range, setRange] = useState("7");
  const [summary, setSummary] = useState<HistorySummary | null>(null);

  useEffect(() => {
    fetch(`/api/history?range=${range}`)
      .then((r) => r.json())
      .then(setSummary);
  }, [range]);

  return (
    <AppShell>
      <Header title="History" subtitle="Trends and patterns" />

      <div className="mb-6 flex gap-2">
        {ranges.map((r) => (
          <Button
            key={r.id}
            variant={range === r.id ? "primary" : "secondary"}
            size="sm"
            onClick={() => setRange(r.id)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      {summary && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <Card>
              <p className="text-sm text-neutral-500">Avg calories</p>
              <p className="text-2xl font-bold">{Math.round(summary.avgCalories)}</p>
            </Card>
            <Card>
              <p className="text-sm text-neutral-500">Avg protein</p>
              <p className="text-2xl font-bold">{Math.round(summary.avgProtein)}g</p>
            </Card>
            <Card>
              <p className="text-sm text-neutral-500">Avg sugar</p>
              <p className="text-2xl font-bold">{Math.round(summary.avgSugar)}g</p>
            </Card>
            <Card>
              <p className="text-sm text-neutral-500">Ingredient flags</p>
              <p className="text-2xl font-bold">{summary.flagCount}</p>
            </Card>
          </div>

          <Card className="mb-4">
            <h3 className="font-semibold">Daily calories</h3>
            <div className="mt-4 flex items-end gap-1 h-32">
              {summary.dailyTrends.map((d) => {
                const max = Math.max(...summary.dailyTrends.map((t) => t.calories), 1);
                const h = (d.calories / max) * 100;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t bg-neutral-900 dark:bg-white" style={{ height: `${h}%`, minHeight: 4 }} />
                    <span className="text-[9px] text-neutral-400">{d.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="mb-4">
            <h3 className="mb-3 font-semibold">Top foods</h3>
            {summary.topFoods.map((f) => (
              <div key={f.name} className="flex justify-between py-2 text-sm border-b border-neutral-100 last:border-0">
                <span>{f.name}</span>
                <span className="text-neutral-500">{f.count}×</span>
              </div>
            ))}
          </Card>

          {summary.weightTrend.length > 0 && (
            <Card>
              <h3 className="mb-3 font-semibold">Weight trend</h3>
              {summary.weightTrend.map((w) => (
                <div key={w.date} className="flex justify-between py-2 text-sm">
                  <span>{w.date}</span>
                  <span className="font-medium">{w.weightKg} kg</span>
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </AppShell>
  );
}
