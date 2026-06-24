// src/lib/kitchen/appliance-sliders.ts — slider limits & setup copy for timed pours

import type { ApplianceCatalogModel, ConfiguredAppliance, DispenseChannelSpec } from "@/types";

export const COFFEE_CHANNEL_ID = "coffee";

/** Minimum slider max for milk/cream on super-automatics (Jura flat whites often 40+ sec) */
export const SUPER_AUTO_LIQUID_MIN_MAX = 60;

export function isCoffeeChannel(channelId: string): boolean {
  return channelId === COFFEE_CHANNEL_ID;
}

export function isLiquidChannel(channelId: string): boolean {
  return !isCoffeeChannel(channelId);
}

export function getChannelSliderMax(
  channel: DispenseChannelSpec,
  model?: ApplianceCatalogModel,
  appliance?: ConfiguredAppliance
): number {
  const configured = appliance?.channelMaxSeconds?.[channel.id];
  if (configured != null) return configured;

  if (model?.category === "super_automatic" && isLiquidChannel(channel.id)) {
    return Math.max(channel.maxSeconds, SUPER_AUTO_LIQUID_MIN_MAX);
  }

  return channel.maxSeconds;
}

export function defaultChannelMaxSeconds(model: ApplianceCatalogModel): Record<string, number> {
  const out: Record<string, number> = {};
  for (const ch of model.channels) {
    out[ch.id] = getChannelSliderMax(ch, model);
  }
  return out;
}

export function channelSetupQuestion(
  channel: DispenseChannelSpec,
  drinkLabel: string,
  machineName: string
): string {
  if (isCoffeeChannel(channel.id)) {
    return `When you make a ${drinkLabel} on your ${machineName}, how many seconds of coffee (espresso) does the machine run? Check the display or count while it pours.`;
  }
  return `For your ${drinkLabel}, how many seconds of ${channel.label.toLowerCase()} show on your ${machineName}? Many machines pour longer than factory defaults — match what YOUR display shows (often 30–50 seconds).`;
}

export function channelLogHint(channel: DispenseChannelSpec): string {
  if (isCoffeeChannel(channel.id)) {
    return "Espresso shot time on your machine's display";
  }
  return channel.setupHint ?? `~${channel.mlPerSecond} ml/s from manufacturer profile`;
}
