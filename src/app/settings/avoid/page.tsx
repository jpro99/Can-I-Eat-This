// src/app/settings/avoid/page.tsx

"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useProfile } from "@/hooks/useProfile";
import { INGREDIENT_CATEGORIES } from "@/lib/ingredients/flags";
import { useState, useEffect } from "react";

export default function AvoidListPage() {
  const { profile, update } = useProfile();
  const [allergies, setAllergies] = useState<string[]>([]);
  const [foodsToAvoid, setFoodsToAvoid] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [avoidSeedOils, setAvoidSeedOils] = useState(false);
  const [newAllergy, setNewAllergy] = useState("");
  const [newFood, setNewFood] = useState("");

  useEffect(() => {
    if (profile) {
      setAllergies(profile.allergies);
      setFoodsToAvoid(profile.foodsToAvoid);
      setClasses(profile.ingredientClassesToAvoid);
      setAvoidSeedOils(profile.avoidSeedOils);
    }
  }, [profile]);

  const save = async () => {
    await update({ allergies, foodsToAvoid, ingredientClassesToAvoid: classes, avoidSeedOils });
  };

  const toggleClass = (id: string) => {
    setClasses((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  return (
    <AppShell hideNav>
      <Header title="Avoid list" backHref="/settings" />

      <Card className="mb-4 space-y-3">
        <h3 className="font-semibold">Allergies</h3>
        <div className="flex flex-wrap gap-2">
          {allergies.map((a) => (
            <button key={a} type="button" className="rounded-full bg-rose-100 px-3 py-1 text-sm" onClick={() => setAllergies(allergies.filter((x) => x !== a))}>
              {a} ×
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Add allergy" value={newAllergy} onChange={(e) => setNewAllergy(e.target.value)} />
          <Button size="sm" onClick={() => { if (newAllergy) { setAllergies([...allergies, newAllergy]); setNewAllergy(""); } }}>Add</Button>
        </div>
      </Card>

      <Card className="mb-4 space-y-3">
        <h3 className="font-semibold">Foods to avoid</h3>
        <div className="flex flex-wrap gap-2">
          {foodsToAvoid.map((f) => (
            <button key={f} type="button" className="rounded-full bg-amber-100 px-3 py-1 text-sm" onClick={() => setFoodsToAvoid(foodsToAvoid.filter((x) => x !== f))}>
              {f} ×
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Add food" value={newFood} onChange={(e) => setNewFood(e.target.value)} />
          <Button size="sm" onClick={() => { if (newFood) { setFoodsToAvoid([...foodsToAvoid, newFood]); setNewFood(""); } }}>Add</Button>
        </div>
      </Card>

      <Card className="mb-4 space-y-3">
        <h3 className="font-semibold">Ingredient classes</h3>
        {INGREDIENT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => toggleClass(cat.id)}
            className={`w-full rounded-2xl border p-3 text-left ${classes.includes(cat.id) ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200"}`}
          >
            {cat.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setAvoidSeedOils(!avoidSeedOils)}
          className={`w-full rounded-2xl border p-3 text-left ${avoidSeedOils ? "border-neutral-900 bg-neutral-50" : "border-neutral-200"}`}
        >
          Flag seed oils
        </button>
      </Card>

      <Button className="w-full" onClick={save}>Save avoid list</Button>
    </AppShell>
  );
}
