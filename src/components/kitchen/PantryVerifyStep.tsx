// src/components/kitchen/PantryVerifyStep.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PantryLabelScanSheet } from "@/components/kitchen/PantryLabelScanSheet";
import {
  findVerifiedPantryForType,
  getPantryRequirements,
  missingPantryVerifications,
  type PantryRequirement,
} from "@/lib/kitchen/pantry-label";
import { PANTRY_TYPE_LABELS } from "@/lib/kitchen/pantry-nutrition";
import { newId } from "@/lib/kitchen/defaults";
import type { ApplianceCatalogModel, KitchenMemory, MachineDrinkPreset, PantryItem } from "@/types";
import { Camera, CheckCircle2 } from "lucide-react";

interface PantryVerifyStepProps {
  model: ApplianceCatalogModel;
  channelSeconds: Record<string, number>;
  drinkPreset?: MachineDrinkPreset;
  kitchenMemory: KitchenMemory;
  onKitchenMemoryChange: (km: KitchenMemory) => void;
  onComplete: (channelPantryIds: Record<string, string>) => void;
  onBack: () => void;
}

export function PantryVerifyStep({
  model,
  channelSeconds,
  drinkPreset,
  kitchenMemory,
  onKitchenMemoryChange,
  onComplete,
  onBack,
}: PantryVerifyStepProps) {
  const requirements = getPantryRequirements(model, channelSeconds, drinkPreset);
  const missing = missingPantryVerifications(kitchenMemory, requirements);
  const [scanTarget, setScanTarget] = useState<PantryRequirement | null>(null);

  const upsertVerifiedItem = (fields: Omit<PantryItem, "id">) => {
    const existing = kitchenMemory.pantryItems.find((p) => p.type === fields.type && p.labelVerified);
    const nextItems = existing
      ? kitchenMemory.pantryItems.map((p) => (p.id === existing.id ? { ...p, ...fields, labelVerified: true } : p))
      : [
          ...kitchenMemory.pantryItems.filter((p) => !(p.type === fields.type && !p.labelVerified)),
          { ...fields, id: newId("pantry") },
        ];
    onKitchenMemoryChange({ ...kitchenMemory, pantryItems: nextItems });
    setScanTarget(null);
  };

  const handleContinue = () => {
    const mapping: Record<string, string> = {};
    for (const ch of model.channels) {
      if (ch.defaultLiquidType === "other") continue;
      if ((channelSeconds[ch.id] ?? 0) <= 0) continue;
      const verified = findVerifiedPantryForType(kitchenMemory, ch.defaultLiquidType);
      if (verified) mapping[ch.id] = verified.id;
    }
    onComplete(mapping);
  };

  if (requirements.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-neutral-600">No milk or cream in this drink — nothing to photograph.</p>
        <Button className="w-full" onClick={() => onComplete({})}>
          Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-700">
        You said this drink uses real products from your fridge. Photograph each nutrition label — we don&apos;t guess when
        you tell us what you use.
      </p>

      {requirements.map((req) => {
        const verified = findVerifiedPantryForType(kitchenMemory, req.type);
        return (
          <div
            key={req.type}
            className={`rounded-2xl border p-4 ${verified ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{PANTRY_TYPE_LABELS[req.type]}</p>
                <p className="mt-1 text-sm text-neutral-600">{req.reason}</p>
                {verified && (
                  <p className="mt-2 flex items-center gap-1 text-sm text-emerald-800">
                    <CheckCircle2 size={16} />
                    {verified.name}
                    {verified.brand ? ` · ${verified.brand}` : ""} · from label
                  </p>
                )}
              </div>
              {!verified && (
                <Button size="sm" onClick={() => setScanTarget(req)}>
                  <Camera size={16} />
                  Scan label
                </Button>
              )}
            </div>
          </div>
        );
      })}

      {missing.length > 0 && (
        <p className="text-sm text-amber-800">
          {missing.length} product{missing.length > 1 ? "s" : ""} still need a label photo before we can calculate
          nutrition accurately.
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button className="flex-1" disabled={missing.length > 0} onClick={handleContinue}>
          Save machine
        </Button>
      </div>

      {scanTarget && (
        <PantryLabelScanSheet
          type={scanTarget.type}
          channelLabel={scanTarget.channelLabel}
          onVerified={upsertVerifiedItem}
          onClose={() => setScanTarget(null)}
        />
      )}
    </div>
  );
}
