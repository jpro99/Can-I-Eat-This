// src/components/today/RoutineLogSheet.tsx

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { DailyRoutine } from "@/types";
import {
  calculateRoutineNutrition,
  describeRoutineServing,
  modifierUnits,
} from "@/lib/routines/calculator";
import { MacroGrid } from "@/components/food/MacroGrid";
import { X } from "lucide-react";

interface RoutineLogSheetProps {
  routine: DailyRoutine;
  onClose: () => void;
  onLogged: () => void;
}

export function RoutineLogSheet({ routine, onClose, onLogged }: RoutineLogSheetProps) {
  const [levels, setLevels] = useState<Record<string, number>>({ ...routine.defaults });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLevels({ ...routine.defaults });
  }, [routine]);

  const nutrition = calculateRoutineNutrition(routine, levels);

  const log = async (saveAsDefault: boolean) => {
    setSaving(true);
    try {
      await fetch("/api/routines/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routineId: routine.id,
          modifierLevels: levels,
          saveAsDefault,
        }),
      });
      onLogged();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 pb-safe-bottom">
      <Card className="max-h-[85vh] w-full max-w-lg overflow-y-auto">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-2xl">{routine.emoji}</p>
            <h2 className="text-xl font-semibold">{routine.name}</h2>
            <p className="text-sm text-neutral-500">{describeRoutineServing(routine, levels)}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-neutral-100">
            <X size={20} />
          </button>
        </div>

        {routine.modifiers.length > 0 && (
          <div className="space-y-5">
            {routine.modifiers.map((mod) => {
              const level = levels[mod.id] ?? 0;
              const units = modifierUnits(level, mod);
              return (
                <div key={mod.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="font-medium">{mod.label}</label>
                    <span className="text-sm text-neutral-500">
                      {units > 0 ? `${units} ${mod.unit}` : "None"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={level}
                    onChange={(e) => setLevels({ ...levels, [mod.id]: parseInt(e.target.value, 10) })}
                    className="w-full accent-neutral-900"
                  />
                  <div className="mt-1 flex justify-between text-xs text-neutral-400">
                    <span>None</span>
                    <span>{mod.maxUnits} {mod.unit} max</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-5">
          <MacroGrid nutrition={nutrition} />
        </div>

        <div className="mt-6 space-y-2">
          <Button className="w-full" size="lg" disabled={saving} onClick={() => log(true)}>
            {saving ? "Logging…" : "Log it (save as my usual)"}
          </Button>
          <Button variant="secondary" className="w-full" disabled={saving} onClick={() => log(false)}>
            Log once — don&apos;t change my usual
          </Button>
        </div>
      </Card>
    </div>
  );
}
