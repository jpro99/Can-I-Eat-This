// src/app/settings/page.tsx

"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useProfile } from "@/hooks/useProfile";
import { ChevronRight, Target, Ban, User } from "lucide-react";
import { useState } from "react";
import { formatWeightLbs, lbsToKg } from "@/lib/units/us";

export default function SettingsPage() {
  const { profile, update } = useProfile();
  const [weight, setWeight] = useState("");

  const logWeight = async () => {
    if (!weight) return;
    const weightKg = lbsToKg(parseFloat(weight));
    await fetch("/api/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weightLbs: parseFloat(weight) }),
    });
    await update({ weightKg });
    setWeight("");
  };

  const links = [
    { href: "/settings/goals", icon: Target, label: "Goals & macros" },
    { href: "/settings/avoid", icon: Ban, label: "Avoid list & allergies" },
    { href: "/settings/supplements", icon: Target, label: "Supplements & creatine" },
    { href: "/profile/setup", icon: User, label: "Edit profile" },
  ];

  return (
    <AppShell>
      <Header title="Settings" />

      <div className="mb-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Card className="flex items-center justify-between transition-transform active:scale-[0.99]">
                <div className="flex items-center gap-3">
                  <Icon size={20} className="text-neutral-500" />
                  <span className="font-medium">{link.label}</span>
                </div>
                <ChevronRight size={18} className="text-neutral-400" />
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="space-y-3">
        <h3 className="font-semibold">Log weight</h3>
        {profile && <p className="text-sm text-neutral-500">Current: {formatWeightLbs(profile.weightKg)}</p>}
        <div className="flex gap-2">
          <Input type="number" placeholder="Weight (lbs)" value={weight} onChange={(e) => setWeight(e.target.value)} />
          <Button onClick={logWeight}>Save</Button>
        </div>
      </Card>

      <Card className="mt-4">
        <p className="text-sm text-neutral-500">
          Caveman provides nutrition guidance based on your settings. It is not medical advice.
        </p>
      </Card>
    </AppShell>
  );
}
