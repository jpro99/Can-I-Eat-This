// src/app/settings/goals/page.tsx

"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useProfile } from "@/hooks/useProfile";
import { useState, useEffect } from "react";
import { suggestMacros } from "@/lib/nutrition/calculator";

export default function GoalsSettingsPage() {
  const { profile, update } = useProfile();
  const [form, setForm] = useState({
    targetCalories: "",
    targetProtein: "",
    targetCarbs: "",
    targetFats: "",
    targetFiber: "",
    targetSodium: "",
    targetSugar: "",
    scoreEatThreshold: "80",
    scoreCautionThreshold: "55",
    strictness: "moderate",
    healthGoal: "maintain",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        targetCalories: String(profile.targetCalories ?? ""),
        targetProtein: String(profile.targetProtein ?? ""),
        targetCarbs: String(profile.targetCarbs ?? ""),
        targetFats: String(profile.targetFats ?? ""),
        targetFiber: String(profile.targetFiber ?? ""),
        targetSodium: String(profile.targetSodium ?? ""),
        targetSugar: String(profile.targetSugar ?? ""),
        scoreEatThreshold: String(profile.scoreEatThreshold),
        scoreCautionThreshold: String(profile.scoreCautionThreshold),
        strictness: profile.strictness,
        healthGoal: profile.healthGoal,
      });
    }
  }, [profile]);

  const autoSuggest = () => {
    if (!profile) return;
    const s = suggestMacros(profile);
    setForm({
      ...form,
      targetCalories: String(s.calories),
      targetProtein: String(s.protein),
      targetCarbs: String(s.carbs),
      targetFats: String(s.fats),
      targetFiber: String(s.fiber),
      targetSodium: String(s.sodium),
      targetSugar: String(s.sugar),
    });
  };

  const save = async () => {
    await update({
      targetCalories: parseInt(form.targetCalories, 10) || null,
      targetProtein: parseInt(form.targetProtein, 10) || null,
      targetCarbs: parseInt(form.targetCarbs, 10) || null,
      targetFats: parseInt(form.targetFats, 10) || null,
      targetFiber: parseInt(form.targetFiber, 10) || null,
      targetSodium: parseInt(form.targetSodium, 10) || null,
      targetSugar: parseInt(form.targetSugar, 10) || null,
      scoreEatThreshold: parseInt(form.scoreEatThreshold, 10),
      scoreCautionThreshold: parseInt(form.scoreCautionThreshold, 10),
      strictness: form.strictness as "moderate",
      healthGoal: form.healthGoal as "maintain",
    });
  };

  return (
    <AppShell hideNav>
      <Header title="Goals & macros" backHref="/settings" />
      <Card className="space-y-3">
        <Button variant="secondary" size="sm" onClick={autoSuggest}>Auto-suggest from profile</Button>
        {(["targetCalories", "targetProtein", "targetCarbs", "targetFats", "targetFiber", "targetSodium", "targetSugar"] as const).map((key) => (
          <Input
            key={key}
            type="number"
            placeholder={key.replace("target", "").replace(/([A-Z])/g, " $1")}
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        ))}
        <p className="text-sm font-medium text-neutral-500">Score thresholds</p>
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" placeholder="Eat (default 80)" value={form.scoreEatThreshold} onChange={(e) => setForm({ ...form, scoreEatThreshold: e.target.value })} />
          <Input type="number" placeholder="Caution (default 55)" value={form.scoreCautionThreshold} onChange={(e) => setForm({ ...form, scoreCautionThreshold: e.target.value })} />
        </div>
      </Card>
      <Button className="mt-6 w-full" onClick={save}>Save goals</Button>
    </AppShell>
  );
}
