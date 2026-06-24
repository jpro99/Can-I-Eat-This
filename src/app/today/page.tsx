// src/app/today/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { MacroBar } from "@/components/food/MacroBar";
import { MealTimeline } from "@/components/food/MealTimeline";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { CoachInsights } from "@/components/coach/CoachInsights";
import { WaterTracker } from "@/components/coach/WaterTracker";
import { MicronutrientPanel } from "@/components/coach/MicronutrientPanel";
import { QuickRoutines } from "@/components/today/QuickRoutines";
import { KitchenPredictions } from "@/components/today/KitchenPredictions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { DailySummary } from "@/types";
import { useProfile } from "@/hooks/useProfile";
import { GLASS_WATER_ML } from "@/lib/units/us";
import { getGreeting } from "@/lib/utils";
import { Mic, ScanBarcode, Clock } from "lucide-react";

export default function TodayPage() {
  const { profile } = useProfile();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [recent, setRecent] = useState<{ foodName: string; id: string }[]>([]);

  const load = async () => {
    const res = await fetch("/api/logs/today");
    if (res.ok) setSummary(await res.json());
    const logsRes = await fetch("/api/logs");
    if (logsRes.ok) {
      const logs = await logsRes.json();
      const unique = new Map<string, string>();
      for (const l of logs) {
        if (!unique.has(l.foodName)) unique.set(l.foodName, l.id);
      }
      setRecent([...unique.entries()].slice(0, 5).map(([foodName, id]) => ({ foodName, id })));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const logWater = async (amountMl: number) => {
    await fetch("/api/water", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountMl }),
    });
    load();
  };

  const firstName = profile?.name.split(" ")[0];
  const isDayStart =
    summary &&
    summary.meals.length === 0 &&
    summary.waterConsumedMl === 0 &&
    summary.consumed.calories === 0;

  return (
    <AppShell>
      <InstallPrompt />
      <Header
        title={firstName ? `${getGreeting()}, ${firstName}` : "Today"}
        subtitle={new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
      />

      {profile && summary && (
        <KitchenPredictions
          predictions={summary.kitchenPredictions ?? []}
          kitchenMemory={profile.kitchenMemory}
          onLogged={load}
          firstName={firstName}
        />
      )}

      {profile && (
        <QuickRoutines
          routines={profile.dailyRoutines}
          onLogged={load}
          onLogWater={() => logWater(GLASS_WATER_ML)}
          firstName={firstName}
          showMorningPrompt={!!isDayStart}
        />
      )}

      {summary && (
        <>
          {summary.insights && (
            <CoachInsights
              insights={summary.insights}
              onLogWater={() => logWater(GLASS_WATER_ML)}
              isDayStart={!!isDayStart}
            />
          )}

          {!isDayStart && (
            <WaterTracker
              consumedMl={summary.waterConsumedMl}
              targetMl={summary.waterTargetMl}
              onLog={logWater}
            />
          )}

          {!isDayStart && (
            <Card className="mb-6">
              <div className="flex items-center justify-around">
                <ProgressRing
                  value={summary.consumed.calories}
                  max={summary.targets.calories}
                  label="Calories"
                  color="#171717"
                />
                <ProgressRing
                  value={summary.consumed.protein}
                  max={summary.targets.protein}
                  label="Protein"
                  unit="g"
                  color="#10b981"
                />
                <div className="text-center">
                  <p className="text-3xl font-bold text-rose-500">{summary.flagCount}</p>
                  <p className="text-xs text-neutral-500">Flags today</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl bg-neutral-50 p-3 text-center dark:bg-neutral-900">
                <p className="text-sm text-neutral-600">
                  <span className="font-semibold text-emerald-600">{Math.round(summary.consumed.protein)}g</span> protein today
                  {" · "}
                  <span className="font-semibold">{Math.round(summary.remaining.protein ?? 0)}g</span> still needed
                </p>
              </div>
              <div className="mt-6 space-y-4">
                <MacroBar label="Carbs" value={summary.consumed.carbs} target={summary.targets.carbs} unit="g" color="bg-blue-500" />
                <MacroBar label="Fat" value={summary.consumed.fats} target={summary.targets.fats} unit="g" color="bg-amber-500" />
                <MacroBar label="Sugar" value={summary.consumed.sugar ?? 0} target={summary.targets.sugar ?? 50} unit="g" color="bg-rose-400" />
                <MacroBar label="Sodium" value={summary.consumed.sodium ?? 0} target={summary.targets.sodium ?? 2300} unit="mg" color="bg-purple-400" />
                <MacroBar label="Fiber" value={summary.consumed.fiber ?? 0} target={summary.targets.fiber ?? 30} unit="g" color="bg-emerald-400" />
              </div>
            </Card>
          )}

          {isDayStart && (
            <Card className="mb-6 border-dashed border-neutral-300 bg-neutral-50">
              <p className="text-center text-sm text-neutral-600">
                Your calorie and macro rings will show up here once you log your first item.
              </p>
            </Card>
          )}

          {summary.micronutrientStatus && !isDayStart && (
            <MicronutrientPanel status={summary.micronutrientStatus} />
          )}

          <div className="mb-4 grid grid-cols-3 gap-2">
            <Link href="/scan/context">
              <Button variant="secondary" className="w-full flex-col h-auto py-4">
                <ScanBarcode size={22} />
                <span className="text-xs">Smart scan</span>
              </Button>
            </Link>
            <Link href="/scan/voice">
              <Button variant="secondary" className="w-full flex-col h-auto py-4">
                <Mic size={22} />
                <span className="text-xs">Voice</span>
              </Button>
            </Link>
            <Link href="/scan">
              <Button className="w-full flex-col h-auto py-4">
                <span className="text-lg">+</span>
                <span className="text-xs">Add food</span>
              </Button>
            </Link>
          </div>

          {recent.length > 0 && (
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-500">
                <Clock size={16} /> Recent foods
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {recent.map((r) => (
                  <Link key={r.id} href={`/meal/${r.id}`}>
                    <span className="whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm shadow-sm dark:bg-neutral-900">
                      {r.foodName}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {summary.meals.length > 0 && (
            <>
              <h2 className="mb-3 text-lg font-semibold">Meals</h2>
              <MealTimeline meals={summary.meals} />
            </>
          )}
        </>
      )}
    </AppShell>
  );
}
