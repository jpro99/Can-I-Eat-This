// src/components/today/QuickRoutines.tsx

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import type { DailyRoutine } from "@/types";
import { RoutineLogSheet } from "@/components/today/RoutineLogSheet";
import { getGreeting } from "@/lib/utils";
import Link from "next/link";
import { Droplets, Plus } from "lucide-react";

interface QuickRoutinesProps {
  routines: DailyRoutine[];
  onLogged: () => void;
  onLogWater: () => void;
  firstName?: string;
  showMorningPrompt?: boolean;
}

export function QuickRoutines({
  routines,
  onLogged,
  onLogWater,
  firstName,
  showMorningPrompt,
}: QuickRoutinesProps) {
  const [activeRoutine, setActiveRoutine] = useState<DailyRoutine | null>(null);
  const hour = new Date().getHours();
  const visible = routines.filter((r) => (showMorningPrompt ? r.showInMorning || hour >= 12 : true));

  const logUsual = async (routine: DailyRoutine) => {
    await fetch("/api/routines/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ routineId: routine.id, saveAsDefault: false }),
    });
    onLogged();
  };

  return (
    <>
      <Card className="mb-6">
        {showMorningPrompt && firstName && (
          <p className="mb-3 text-sm leading-relaxed text-neutral-600">
            {getGreeting()}, {firstName}. Start with something you have most days — or add what you&apos;ve had so far.
          </p>
        )}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {visible.map((routine) => (
            <div key={routine.id} className="flex shrink-0 flex-col gap-1">
              <button
                type="button"
                onClick={() => logUsual(routine)}
                className="flex min-w-[5.5rem] flex-col items-center rounded-2xl bg-neutral-900 px-4 py-3 text-white active:scale-95"
              >
                <span className="text-2xl">{routine.emoji ?? "🍽️"}</span>
                <span className="mt-1 text-xs font-medium">{routine.name.split(" ")[0]}</span>
              </button>
              {routine.modifiers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveRoutine(routine)}
                  className="text-center text-xs text-neutral-500 underline-offset-2 hover:underline"
                >
                  Adjust
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={onLogWater}
            className="flex min-w-[5.5rem] shrink-0 flex-col items-center rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-900 active:scale-95"
          >
            <Droplets size={24} className="text-blue-600" />
            <span className="mt-1 text-xs font-medium">Water</span>
          </button>
          <Link
            href="/scan"
            className="flex min-w-[5.5rem] shrink-0 flex-col items-center justify-center rounded-2xl border border-neutral-200 px-4 py-3 active:scale-95"
          >
            <Plus size={24} />
            <span className="mt-1 text-xs font-medium">Add food</span>
          </Link>
        </div>
        <p className="mt-3 text-xs text-neutral-400">
          Tap once for your usual. Use Adjust for cream, milk, hot sauce, and other sliders.
        </p>
      </Card>

      {activeRoutine && (
        <RoutineLogSheet
          routine={activeRoutine}
          onClose={() => setActiveRoutine(null)}
          onLogged={onLogged}
        />
      )}
    </>
  );
}
