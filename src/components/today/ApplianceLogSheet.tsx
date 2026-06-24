// src/components/today/ApplianceLogSheet.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ApplianceChannelSliders } from "@/components/kitchen/ApplianceChannelSliders";
import { PantryLabelScanSheet } from "@/components/kitchen/PantryLabelScanSheet";
import { calculateApplianceDrink } from "@/lib/kitchen/appliance-calculator";
import { applyDrinkPreset, findCatalogModel, getDrinkPresets } from "@/lib/kitchen/appliance-catalog";
import { newId } from "@/lib/kitchen/defaults";
import {
  findVerifiedPantryForType,
  unverifiedPantryForAppliance,
  type PantryRequirement,
} from "@/lib/kitchen/pantry-label";
import { PANTRY_TYPE_LABELS } from "@/lib/kitchen/pantry-nutrition";
import type { ConfiguredAppliance, KitchenMemory, MachineDrinkPreset, PantryItem } from "@/types";
import { MacroGrid } from "@/components/food/MacroGrid";
import { Camera, X } from "lucide-react";

interface ApplianceLogSheetProps {
  appliance: ConfiguredAppliance;
  kitchenMemory: KitchenMemory;
  onClose: () => void;
  onLogged: () => void;
  onPantryUpdated?: (km: KitchenMemory) => void;
}

export function ApplianceLogSheet({
  appliance,
  kitchenMemory: kmProp,
  onClose,
  onLogged,
  onPantryUpdated,
}: ApplianceLogSheetProps) {
  const model = findCatalogModel(appliance.catalogModelId);
  const presets = model ? getDrinkPresets(model) : [];
  const [km, setKm] = useState(kmProp);
  const [seconds, setSeconds] = useState({ ...appliance.channelSeconds });
  const [pantryIds, setPantryIds] = useState({ ...appliance.channelPantryIds });
  const [activeDrink, setActiveDrink] = useState(appliance.usualDrinkLabel ?? "");
  const [activeDrinkId, setActiveDrinkId] = useState(appliance.usualDrinkId ?? "");
  const [saving, setSaving] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const [scanTarget, setScanTarget] = useState<PantryRequirement | null>(null);

  const effectiveAppliance = { ...appliance, channelSeconds: seconds, channelPantryIds: pantryIds };
  const drinkPreset = presets.find((p) => p.id === activeDrinkId) ?? presets.find((p) => p.label === activeDrink);
  const missingLabels = unverifiedPantryForAppliance(km, model, seconds, pantryIds, drinkPreset);
  const canLog = missingLabels.length === 0;

  const preview = calculateApplianceDrink(
    { ...effectiveAppliance, usualDrinkLabel: activeDrink || appliance.usualDrinkLabel },
    km
  );

  const applyPreset = (preset: MachineDrinkPreset) => {
    if (!model) return;
    setSeconds(applyDrinkPreset(model, preset));
    setActiveDrink(preset.label);
    setActiveDrinkId(preset.id);
    if (model) {
      const mapping = { ...pantryIds };
      for (const ch of model.channels) {
        if (ch.defaultLiquidType === "other") continue;
        if ((preset.channelSeconds[ch.id] ?? 0) <= 0) continue;
        const verified = findVerifiedPantryForType(km, ch.defaultLiquidType);
        if (verified) mapping[ch.id] = verified.id;
      }
      setPantryIds(mapping);
    }
  };

  const upsertVerifiedPantry = (fields: Omit<PantryItem, "id">) => {
    const existing = km.pantryItems.find((p) => p.type === fields.type && p.labelVerified);
    const item: PantryItem = existing
      ? { ...existing, ...fields, labelVerified: true }
      : { ...fields, id: newId("pantry"), labelVerified: true };
    const nextItems = existing
      ? km.pantryItems.map((p) => (p.id === existing.id ? item : p))
      : [...km.pantryItems.filter((p) => !(p.type === fields.type && !p.labelVerified)), item];
    const nextKm = { ...km, pantryItems: nextItems };
    setKm(nextKm);
    onPantryUpdated?.(nextKm);

    if (model && scanTarget?.channelId) {
      setPantryIds({ ...pantryIds, [scanTarget.channelId]: item.id });
    } else if (model) {
      const mapping = { ...pantryIds };
      for (const ch of model.channels) {
        if (ch.defaultLiquidType === fields.type && (seconds[ch.id] ?? 0) > 0) {
          mapping[ch.id] = item.id;
        }
      }
      setPantryIds(mapping);
    }
    setScanTarget(null);
  };

  const log = async (saveDefaults: boolean) => {
    if (!canLog) {
      setLogError("Photograph your product labels first — we don't guess.");
      return;
    }
    setSaving(true);
    setLogError(null);
    try {
      const res = await fetch("/api/kitchen/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "appliance",
          sourceId: appliance.id,
          channelSeconds: seconds,
          channelPantryIds: pantryIds,
          saveDefaults,
          usualDrinkLabel: activeDrink || undefined,
          usualDrinkId: activeDrinkId || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setLogError(body.error ?? "Could not log — check product labels");
        return;
      }
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
            <p className="text-sm text-neutral-500">
              {activeDrink || appliance.usualDrinkLabel || model?.fullName} — match seconds on your machine
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-neutral-100">
            <X size={20} />
          </button>
        </div>

        {missingLabels.length > 0 && (
          <div className="mb-4 space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-medium text-amber-950">Label photos required</p>
            <p className="text-sm text-amber-900">
              This drink uses products we haven&apos;t verified yet. Photograph each carton — no guessing.
            </p>
            {missingLabels.map((req) => (
              <Button key={req.type} variant="secondary" size="sm" className="w-full justify-start" onClick={() => setScanTarget(req)}>
                <Camera size={16} />
                Scan {PANTRY_TYPE_LABELS[req.type]} label
              </Button>
            ))}
          </div>
        )}

        {presets.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-neutral-700">Drink program</p>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    activeDrink === p.label
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {model && (
          <ApplianceChannelSliders
            model={model}
            channels={model.channels}
            seconds={seconds}
            onChange={(next) => {
              setSeconds(next);
              if (activeDrink && appliance.usualDrinkLabel === activeDrink) {
                setActiveDrink(`${activeDrink} (adjusted)`);
              }
            }}
            mode="log"
            drinkLabel={activeDrink || "your drink"}
            appliance={appliance}
          />
        )}

        <MacroGrid nutrition={preview.nutrition} />
        {!canLog && (
          <p className="mt-2 text-xs text-amber-700">Nutrition incomplete until product labels are scanned.</p>
        )}
        <p className="mt-2 text-xs text-neutral-500">{preview.servingDescription}</p>
        {logError && <p className="mt-2 text-sm text-rose-600">{logError}</p>}

        <div className="mt-6 space-y-2">
          <Button className="w-full" size="lg" disabled={saving || !canLog} onClick={() => log(true)}>
            Log & save as my usual
          </Button>
          <Button variant="secondary" className="w-full" disabled={saving || !canLog} onClick={() => log(false)}>
            Log once only
          </Button>
        </div>
      </Card>

      {scanTarget && (
        <PantryLabelScanSheet
          type={scanTarget.type}
          channelLabel={scanTarget.channelLabel}
          onVerified={upsertVerifiedPantry}
          onClose={() => setScanTarget(null)}
        />
      )}
    </div>
  );
}
