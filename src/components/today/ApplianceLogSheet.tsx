// src/components/today/ApplianceLogSheet.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { calculateApplianceDrink } from "@/lib/kitchen/appliance-calculator";
import { findCatalogModel } from "@/lib/kitchen/appliance-catalog";
import type { ConfiguredAppliance, KitchenMemory } from "@/types";
import { MacroGrid } from "@/components/food/MacroGrid";
import { X } from "lucide-react";

interface ApplianceLogSheetProps {
  appliance: ConfiguredAppliance;
  kitchenMemory: KitchenMemory;
  onClose: () => void;
  onLogged: () => void;
}

export function ApplianceLogSheet({ appliance, kitchenMemory, onClose, onLogged }: ApplianceLogSheetProps) {
  const model = findCatalogModel(appliance.catalogModelId);
  const [seconds, setSeconds] = useState({ ...appliance.channelSeconds });
  const [saving, setSaving] = useState(false);

  const preview = calculateApplianceDrink({ ...appliance, channelSeconds: seconds }, kitchenMemory);

  const log = async (saveDefaults: boolean) => {
    setSaving(true);
    try {
      await fetch("/api/kitchen/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "appliance",
          sourceId: appliance.id,
          channelSeconds: seconds,
          saveDefaults,
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
      <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">{appliance.nickname || model?.fullName}</h2>
            <p className="text-sm text-neutral-500">{model?.fullName} — pour time in seconds</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-neutral-100">
            <X size={20} />
          </button>
        </div>

        {(model?.channels ?? []).map((ch) => (
          <div key={ch.id} className="mb-5">
            <div className="mb-2 flex justify-between">
              <span className="font-medium">{ch.label}</span>
              <span className="text-sm text-neutral-500">{seconds[ch.id] ?? 0} sec</span>
            </div>
            <input
              type="range"
              min={0}
              max={ch.maxSeconds}
              step={0.5}
              value={seconds[ch.id] ?? 0}
              onChange={(e) => setSeconds({ ...seconds, [ch.id]: parseFloat(e.target.value) })}
              className="w-full accent-neutral-900"
            />
            <p className="mt-1 text-xs text-neutral-400">
              ~{ch.mlPerSecond} ml/s from manufacturer profile · calibrate in Kitchen settings
            </p>
          </div>
        ))}

        <MacroGrid nutrition={preview.nutrition} />
        <p className="mt-2 text-xs text-neutral-500">{preview.servingDescription}</p>

        <div className="mt-6 space-y-2">
          <Button className="w-full" size="lg" disabled={saving} onClick={() => log(true)}>
            Log & save as my usual
          </Button>
          <Button variant="secondary" className="w-full" disabled={saving} onClick={() => log(false)}>
            Log once only
          </Button>
        </div>
      </Card>
    </div>
  );
}
