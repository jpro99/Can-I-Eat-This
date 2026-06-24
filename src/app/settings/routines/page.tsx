// src/app/settings/routines/page.tsx

"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useProfile } from "@/hooks/useProfile";
import type { DailyRoutine } from "@/types";
import { modifierUnits } from "@/lib/routines/calculator";
import { useEffect, useState } from "react";

export default function RoutinesSettingsPage() {
  const { profile, update } = useProfile();
  const [routines, setRoutines] = useState<DailyRoutine[]>([]);

  useEffect(() => {
    if (profile?.dailyRoutines) setRoutines(profile.dailyRoutines);
  }, [profile]);

  const updateDefaults = (routineId: string, modifierId: string, level: number) => {
    setRoutines((prev) =>
      prev.map((r) =>
        r.id === routineId ? { ...r, defaults: { ...r.defaults, [modifierId]: level } } : r
      )
    );
  };

  const save = async () => {
    await update({ dailyRoutines: routines });
  };

  return (
    <AppShell hideNav>
      <Header title="Daily routines" subtitle="One-tap coffee, add-ons & more" backHref="/settings" />

      <Card className="mb-4">
        <p className="text-sm text-neutral-600">
          Set your usual amounts here. On Today, tap once to log instantly — or Adjust for sliders before logging.
        </p>
      </Card>

      {routines.map((routine) => (
        <Card key={routine.id} className="mb-4 space-y-4">
          <div>
            <p className="text-2xl">{routine.emoji}</p>
            <h3 className="font-semibold">{routine.name}</h3>
            <p className="text-sm text-neutral-500">{routine.servingDescription}</p>
          </div>
          {routine.modifiers.map((mod) => {
            const level = routine.defaults[mod.id] ?? 0;
            return (
              <div key={mod.id}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium">{mod.label}</span>
                  <span className="text-neutral-500">
                    {modifierUnits(level, mod)} {mod.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={level}
                  onChange={(e) => updateDefaults(routine.id, mod.id, parseInt(e.target.value, 10))}
                  className="w-full accent-neutral-900"
                />
              </div>
            );
          })}
        </Card>
      ))}

      <Button className="w-full" onClick={save}>
        Save routines
      </Button>
    </AppShell>
  );
}
