// src/components/kitchen/ApplianceChannelSliders.tsx

"use client";

import {
  channelLogHint,
  channelSetupQuestion,
  getChannelSliderMax,
} from "@/lib/kitchen/appliance-sliders";
import type { ApplianceCatalogModel, ConfiguredAppliance, DispenseChannelSpec } from "@/types";

interface ApplianceChannelSlidersProps {
  model: ApplianceCatalogModel;
  channels: DispenseChannelSpec[];
  seconds: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
  /** Setup mode shows full questions; log mode shows compact labels */
  mode?: "setup" | "log";
  drinkLabel?: string;
  appliance?: ConfiguredAppliance;
}

export function ApplianceChannelSliders({
  model,
  channels,
  seconds,
  onChange,
  mode = "log",
  drinkLabel = "your drink",
  appliance,
}: ApplianceChannelSlidersProps) {
  return (
    <>
      {channels.map((ch) => {
        const max = getChannelSliderMax(ch, model, appliance);
        const value = seconds[ch.id] ?? 0;
        return (
          <div key={ch.id} className="mb-5">
            {mode === "setup" ? (
              <p className="mb-2 text-sm text-neutral-700">
                {channelSetupQuestion(ch, drinkLabel, model.fullName)}
              </p>
            ) : (
              <div className="mb-2 flex justify-between">
                <span className="font-medium">{ch.label}</span>
                <span className="text-sm text-neutral-500">{value} sec</span>
              </div>
            )}
            <div className="mb-1 flex justify-between text-sm">
              <span className={mode === "setup" ? "font-medium" : "sr-only"}>{ch.label}</span>
              <span className="font-semibold tabular-nums">{value}s</span>
            </div>
            <input
              type="range"
              min={0}
              max={max}
              step={1}
              value={value}
              onChange={(e) => onChange({ ...seconds, [ch.id]: parseFloat(e.target.value) })}
              className="w-full accent-neutral-900"
              aria-label={`${ch.label} seconds`}
            />
            <div className="mt-1 flex justify-between text-xs text-neutral-400">
              <span>{channelLogHint(ch)}</span>
              <span>0–{max}s</span>
            </div>
          </div>
        );
      })}
    </>
  );
}
