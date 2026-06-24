// src/components/fitness/ActivityTracker.tsx

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useActivitySession } from "@/hooks/useActivitySession";
import { ACTIVITY_QUICK_PRESETS, ACTIVITY_TYPE_LABELS } from "@/lib/activity/presets";
import type { ActivityLogItem } from "@/types";
import { Activity, Footprints, Pause, Play, Trash2 } from "lucide-react";

interface ActivityTrackerProps {
  activities: ActivityLogItem[];
  caloriesBurned: number;
  effectiveRemainingCalories: number;
  netCalories: number;
  weightKg: number;
  onUpdated: () => void;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ActivityTracker({
  activities,
  caloriesBurned,
  effectiveRemainingCalories,
  netCalories,
  weightKg,
  onUpdated,
}: ActivityTrackerProps) {
  const session = useActivitySession(weightKg);
  const [stepsInput, setStepsInput] = useState("");
  const [showSteps, setShowSteps] = useState(false);
  const [saving, setSaving] = useState(false);

  const logActivity = async (payload: Record<string, unknown>) => {
    setSaving(true);
    try {
      await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      onUpdated();
    } finally {
      setSaving(false);
    }
  };

  const finishSession = async () => {
    const result = session.stop();
    if (result) {
      await logActivity({
        activityType: result.activityType,
        durationMin: result.durationMin,
        distanceKm: result.distanceKm,
        source: "gps",
        notes: result.distanceKm ? `${result.distanceKm} km tracked` : undefined,
      });
    }
  };

  const deleteActivity = async (id: string) => {
    await fetch(`/api/activity?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    onUpdated();
  };

  return (
    <Card className="mb-6 border-sky-200 bg-gradient-to-br from-sky-50 to-white">
      <div className="mb-3 flex items-center gap-2">
        <Activity className="h-5 w-5 text-sky-600" />
        <h2 className="font-semibold text-sky-950">Total fitness</h2>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-white/80 p-2">
          <p className="text-lg font-bold text-neutral-900">{Math.round(netCalories)}</p>
          <p className="text-xs text-neutral-500">Net cal</p>
        </div>
        <div className="rounded-xl bg-white/80 p-2">
          <p className="text-lg font-bold text-sky-600">{caloriesBurned}</p>
          <p className="text-xs text-neutral-500">Burned</p>
        </div>
        <div className="rounded-xl bg-white/80 p-2">
          <p className="text-lg font-bold text-emerald-600">{Math.max(0, Math.round(effectiveRemainingCalories))}</p>
          <p className="text-xs text-neutral-500">Can eat</p>
        </div>
      </div>

      <p className="mb-3 text-xs text-neutral-600">
        Walks and runs add bonus calories on top of your daily target. Start GPS tracking or quick-log activity.
      </p>

      {session.active ? (
        <div className="mb-4 rounded-2xl bg-sky-900 p-4 text-white">
          <p className="text-sm font-medium uppercase tracking-wide text-sky-200">
            {ACTIVITY_TYPE_LABELS[session.activityType]} in progress
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums">{formatDuration(session.elapsedSec)}</p>
          <p className="text-sm text-sky-100">
            {session.distanceKm > 0 ? `${session.distanceKm} km · GPS` : "Waiting for GPS…"}
          </p>
          {session.error && <p className="mt-1 text-xs text-amber-200">{session.error}</p>}
          <div className="mt-4 flex gap-2">
            <Button className="flex-1 bg-white text-sky-900 hover:bg-sky-100" disabled={saving} onClick={finishSession}>
              <Pause size={18} />
              Finish & log
            </Button>
            <Button variant="secondary" className="border-white/30 bg-transparent text-white" onClick={session.cancel}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex gap-2">
          <Button className="flex-1" disabled={saving} onClick={() => session.start("walk")}>
            <Play size={16} />
            Start walk
          </Button>
          <Button variant="secondary" className="flex-1" disabled={saving} onClick={() => session.start("run")}>
            <Play size={16} />
            Start run
          </Button>
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        {ACTIVITY_QUICK_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={saving || session.active}
            onClick={() =>
              logActivity({
                activityType: p.activityType,
                durationMin: p.durationMin,
                distanceKm: p.distanceKm,
                source: "manual",
              })
            }
            className="rounded-full bg-white px-3 py-1.5 text-sm shadow-sm active:scale-95 disabled:opacity-50"
          >
            {p.emoji} {p.label}
          </button>
        ))}
      </div>

      {!showSteps ? (
        <Button variant="secondary" size="sm" className="w-full" onClick={() => setShowSteps(true)}>
          <Footprints size={16} />
          Log steps
        </Button>
      ) : (
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Steps today"
            value={stepsInput}
            onChange={(e) => setStepsInput(e.target.value)}
          />
          <Button
            disabled={saving || !stepsInput}
            onClick={() => {
              void logActivity({ activityType: "steps", steps: parseInt(stepsInput, 10), source: "steps" }).then(() => {
                setStepsInput("");
                setShowSteps(false);
              });
            }}
          >
            Add
          </Button>
        </div>
      )}

      {activities.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-sky-100 pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Today&apos;s activity</p>
          {activities.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2 text-sm">
              <div>
                <span className="font-medium">{a.label}</span>
                <span className="text-neutral-500">
                  {" "}
                  · {Math.round(a.durationMin)} min
                  {a.distanceKm ? ` · ${a.distanceKm} km` : ""}
                  {a.steps ? ` · ${a.steps.toLocaleString()} steps` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sky-600">-{a.caloriesBurned}</span>
                <button type="button" onClick={() => void deleteActivity(a.id)} className="text-neutral-400 hover:text-rose-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
