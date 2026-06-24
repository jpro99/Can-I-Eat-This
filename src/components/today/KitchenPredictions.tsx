// src/components/today/KitchenPredictions.tsx

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { ConfiguredAppliance, KitchenMemory, KitchenPrediction } from "@/types";
import { DEFAULT_KITCHEN_MEMORY } from "@/lib/kitchen/defaults";
import { findCatalogModel, getDrinkPresets } from "@/lib/kitchen/appliance-catalog";
import { unverifiedPantryForAppliance } from "@/lib/kitchen/pantry-label";
import { ApplianceLogSheet } from "@/components/today/ApplianceLogSheet";
import { useProfile } from "@/hooks/useProfile";
import Link from "next/link";
import { Sparkles } from "lucide-react";

interface KitchenPredictionsProps {
  predictions: KitchenPrediction[];
  kitchenMemory?: KitchenMemory;
  onLogged: () => void;
  firstName?: string;
}

export function KitchenPredictions({
  predictions,
  kitchenMemory: kmProp,
  onLogged,
  firstName,
}: KitchenPredictionsProps) {
  const { update } = useProfile();
  const kitchenMemory = kmProp ?? DEFAULT_KITCHEN_MEMORY;
  const [applianceSheet, setApplianceSheet] = useState<ConfiguredAppliance | null>(null);

  const logPrediction = async (p: KitchenPrediction, channelSeconds?: Record<string, number>) => {
    if (p.type === "appliance") {
      const app = kitchenMemory.appliances.find((a) => a.id === p.sourceId);
      if (app) {
        const model = findCatalogModel(app.catalogModelId);
        const missing = unverifiedPantryForAppliance(
          kitchenMemory,
          model,
          channelSeconds ?? app.channelSeconds,
          app.channelPantryIds,
          model ? getDrinkPresets(model).find((p) => p.id === app.usualDrinkId) : undefined
        );
        if (missing.length > 0) {
          setApplianceSheet(app);
          return;
        }
      }
      const res = await fetch("/api/kitchen/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "appliance",
          sourceId: p.sourceId,
          channelSeconds,
          saveDefaults: !!channelSeconds,
        }),
      });
      if (res.status === 422) {
        const app = kitchenMemory.appliances.find((a) => a.id === p.sourceId);
        if (app) setApplianceSheet(app);
        return;
      }
      onLogged();
      return;
    }
    if (p.type === "venue" || p.type === "template") {
      await fetch("/api/kitchen/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: p.type, sourceId: p.sourceId }),
      });
      onLogged();
      return;
    }
    if (p.type === "routine") {
      await fetch("/api/routines/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routineId: p.sourceId }),
      });
      onLogged();
    }
  };

  const top = predictions[0];

  return (
    <>
      <Card className="mb-6 border-violet-200 bg-gradient-to-br from-violet-50 to-white">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-600" />
          <h2 className="font-semibold text-violet-950">Kitchen Memory</h2>
        </div>

        {!kitchenMemory.setupComplete && (
          <div className="mb-4 rounded-2xl bg-white/80 p-3">
            <p className="text-sm text-neutral-700">
              {firstName ? `${firstName}, train` : "Train"} your kitchen once — coffee machine seconds, milk, cream, Starbucks usuals, and spice sets — then one tap every day.
            </p>
            <Link href="/kitchen">
              <Button className="mt-3 w-full" size="sm">
                Set up Kitchen Memory
              </Button>
            </Link>
          </div>
        )}

        {top && (
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Expected now</p>
            <div className="mt-2 flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">
                  {top.emoji} {top.label}
                </p>
                <p className="mt-1 text-sm text-neutral-600">{top.description}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  if (top.type === "appliance") {
                    const app = kitchenMemory.appliances.find((a) => a.id === top.sourceId);
                    if (app) void logPrediction(top);
                    else onLogged();
                  } else {
                    void logPrediction(top);
                  }
                }}
              >
                Log my usual
              </Button>
              {top.type === "appliance" && (
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    const app = kitchenMemory.appliances.find((a) => a.id === top.sourceId);
                    if (app) setApplianceSheet(app);
                  }}
                >
                  Adjust seconds
                </Button>
              )}
            </div>
          </div>
        )}

        {predictions.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {predictions.slice(1, 5).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => void logPrediction(p)}
                className="shrink-0 rounded-2xl border border-violet-100 bg-white px-4 py-2 text-left text-sm active:scale-95"
              >
                <span className="mr-1">{p.emoji}</span>
                {p.label}
              </button>
            ))}
          </div>
        )}

        {kitchenMemory.setupComplete && predictions.length === 0 && (
          <p className="text-sm text-neutral-500">You&apos;re caught up on your usuals. Add food if something was different today.</p>
        )}
      </Card>

      {applianceSheet && (
        <ApplianceLogSheet
          appliance={applianceSheet}
          kitchenMemory={kitchenMemory}
          onClose={() => setApplianceSheet(null)}
          onLogged={onLogged}
          onPantryUpdated={(next) => void update({ kitchenMemory: next })}
        />
      )}
    </>
  );
}
