// src/app/settings/supplements/page.tsx

"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useProfile } from "@/hooks/useProfile";
import { DEFAULT_SUPPLEMENTS } from "@/lib/profile/mapper";
import type { Supplement } from "@/types";
import { useEffect, useState } from "react";

export default function SupplementsPage() {
  const { profile, update } = useProfile();
  const [supplements, setSupplements] = useState<Supplement[]>(DEFAULT_SUPPLEMENTS);
  const [avoidGmo, setAvoidGmo] = useState(false);

  useEffect(() => {
    if (profile) {
      setSupplements(profile.supplements.length > 0 ? profile.supplements : DEFAULT_SUPPLEMENTS);
      setAvoidGmo(profile.avoidGmo);
    }
  }, [profile]);

  const toggle = (id: string) => {
    setSupplements((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const save = async () => {
    await update({ supplements, avoidGmo });
  };

  return (
    <AppShell hideNav>
      <Header title="Supplements & flags" backHref="/settings" />

      <Card className="mb-4 space-y-3">
        <h3 className="font-semibold">Supplements you take</h3>
        {supplements.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => toggle(s.id)}
            className={`w-full rounded-2xl border p-4 text-left ${s.active ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200"}`}
          >
            <p className="font-medium">{s.name}</p>
            {s.hydrationNote && (
              <p className={`mt-1 text-sm ${s.active ? "text-neutral-300" : "text-neutral-500"}`}>
                {s.hydrationNote}
              </p>
            )}
          </button>
        ))}
      </Card>

      <Card className="mb-4">
        <button
          type="button"
          onClick={() => setAvoidGmo(!avoidGmo)}
          className={`w-full rounded-2xl border p-4 text-left ${avoidGmo ? "border-neutral-900 bg-neutral-50" : "border-neutral-200"}`}
        >
          <p className="font-medium">Flag GMO ingredients & oils</p>
          <p className="mt-1 text-sm text-neutral-500">Restaurant and packaged food warnings will include GMO risk when known.</p>
        </button>
      </Card>

      <Button className="w-full" onClick={save}>Save</Button>
    </AppShell>
  );
}
