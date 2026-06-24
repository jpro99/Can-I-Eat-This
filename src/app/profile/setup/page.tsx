// src/app/profile/setup/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useProfile } from "@/hooks/useProfile";
import { cmToFeetInches, feetInchesToCm, kgToLbs, lbsToKg } from "@/lib/units/us";

const GOALS = [
  { id: "fat_loss", label: "Fat loss" },
  { id: "maintain", label: "Maintain" },
  { id: "muscle_gain", label: "Muscle gain" },
  { id: "clean_eating", label: "Clean eating" },
];

const ACTIVITY = [
  { id: "sedentary", label: "Sedentary" },
  { id: "light", label: "Light" },
  { id: "moderate", label: "Moderate" },
  { id: "active", label: "Active" },
  { id: "very_active", label: "Very active" },
];

export default function ProfileSetupPage() {
  const router = useRouter();
  const { profile, update } = useProfile();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    age: "30",
    sex: "other",
    heightFt: "5",
    heightIn: "7",
    weightLbs: "154",
    goalWeightLbs: "",
    activityLevel: "moderate",
    healthGoal: "maintain",
    strictness: "moderate",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile?.onboardingComplete) return;
    const { feet, inches } = cmToFeetInches(profile.heightCm);
    setForm({
      name: profile.name,
      age: String(profile.age),
      sex: profile.sex,
      heightFt: String(feet),
      heightIn: String(inches),
      weightLbs: String(Math.round(kgToLbs(profile.weightKg))),
      goalWeightLbs: profile.goalWeightKg ? String(Math.round(kgToLbs(profile.goalWeightKg))) : "",
      activityLevel: profile.activityLevel,
      healthGoal: profile.healthGoal,
      strictness: profile.strictness,
    });
  }, [profile]);

  const save = async () => {
    setSaving(true);
    await update({
      name: form.name,
      age: parseInt(form.age, 10),
      sex: form.sex as "male" | "female" | "other",
      heightCm: feetInchesToCm(parseInt(form.heightFt, 10) || 0, parseFloat(form.heightIn) || 0),
      weightKg: lbsToKg(parseFloat(form.weightLbs)),
      goalWeightKg: form.goalWeightLbs ? lbsToKg(parseFloat(form.goalWeightLbs)) : null,
      activityLevel: form.activityLevel as "moderate",
      healthGoal: form.healthGoal as "maintain",
      strictness: form.strictness as "moderate",
      supplements: [{ id: "creatine", name: "Creatine", active: false, requiresHydration: true, hydrationNote: "Drink extra water when taking creatine." }],
      onboardingComplete: true,
    });
    router.push(profile?.onboardingComplete ? "/settings" : "/today");
  };

  return (
    <AppShell hideNav>
      <Header title="Your profile" subtitle={`Step ${step + 1} of 3`} backHref={step > 0 ? undefined : profile?.onboardingComplete ? "/settings" : "/onboarding"} />

      {step === 0 && (
        <Card className="space-y-4">
          <Input placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" placeholder="Age" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
            <select
              className="h-12 rounded-2xl border border-neutral-200 bg-white px-4"
              value={form.sex}
              onChange={(e) => setForm({ ...form, sex: e.target.value })}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input type="number" placeholder="Height (ft)" value={form.heightFt} onChange={(e) => setForm({ ...form, heightFt: e.target.value })} />
            <Input type="number" placeholder="Height (in)" value={form.heightIn} onChange={(e) => setForm({ ...form, heightIn: e.target.value })} />
            <Input type="number" placeholder="Weight (lbs)" value={form.weightLbs} onChange={(e) => setForm({ ...form, weightLbs: e.target.value })} />
          </div>
          <Input type="number" placeholder="Goal weight (lbs, optional)" value={form.goalWeightLbs} onChange={(e) => setForm({ ...form, goalWeightLbs: e.target.value })} />
        </Card>
      )}

      {step === 1 && (
        <Card className="space-y-4">
          <p className="text-sm font-medium text-neutral-500">Health goal</p>
          <div className="grid grid-cols-2 gap-2">
            {GOALS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setForm({ ...form, healthGoal: g.id })}
                className={`rounded-2xl border p-4 text-left transition-colors ${form.healthGoal === g.id ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200"}`}
              >
                {g.label}
              </button>
            ))}
          </div>
          <p className="text-sm font-medium text-neutral-500">Activity level</p>
          <div className="space-y-2">
            {ACTIVITY.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setForm({ ...form, activityLevel: a.id })}
                className={`w-full rounded-2xl border p-3 text-left ${form.activityLevel === a.id ? "border-neutral-900 bg-neutral-50" : "border-neutral-200"}`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-4">
          <p className="text-sm text-neutral-500">
            We&apos;ll calculate your daily calorie and macro targets. You can override them anytime in Settings.
          </p>
          <p className="text-sm font-medium text-neutral-500">Strictness</p>
          <div className="grid grid-cols-3 gap-2">
            {["strict", "moderate", "flexible"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm({ ...form, strictness: s })}
                className={`rounded-2xl border p-3 capitalize ${form.strictness === s ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <Button variant="secondary" className="flex-1" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        )}
        <Button
          className="flex-1"
          disabled={saving || (step === 0 && !form.name)}
          onClick={() => {
            if (step < 2) setStep(step + 1);
            else save();
          }}
        >
          {step < 2 ? "Next" : saving ? "Saving…" : "Start using Caveman"}
        </Button>
      </div>
    </AppShell>
  );
}
