// src/lib/water/vessels.ts

import type { WaterVessel } from "@/types";

export function parseWaterVessels(raw: string | null | undefined): WaterVessel[] {
  if (!raw || raw === "[]") return [];
  try {
    const parsed = JSON.parse(raw) as WaterVessel[];
    return Array.isArray(parsed) ? parsed.map(normalizeVessel) : [];
  } catch {
    return [];
  }
}

export function normalizeVessel(v: WaterVessel): WaterVessel {
  return {
    ...v,
    photoSetupComplete: v.photoSetupComplete ?? false,
  };
}

export function newVesselId(): string {
  return `vessel-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function getDefaultVessel(
  vessels: WaterVessel[],
  defaultId?: string | null
): WaterVessel | undefined {
  if (defaultId) {
    const found = vessels.find((v) => v.id === defaultId);
    if (found) return found;
  }
  return vessels.find((v) => v.photoSetupComplete) ?? vessels[0];
}

export function hasSetupVessel(vessels: WaterVessel[]): boolean {
  return vessels.some((v) => v.photoSetupComplete && v.volumeFlOz > 0);
}
