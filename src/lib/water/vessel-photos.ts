// src/lib/water/vessel-photos.ts — cup photos stay on device (not in DB)

const PREFIX = "caveman-vessel-photo:";

export function saveVesselPhoto(vesselId: string, dataUrl: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFIX + vesselId, dataUrl);
  } catch {
    /* quota — photo optional */
  }
}

export function getVesselPhoto(vesselId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PREFIX + vesselId);
}

export function removeVesselPhoto(vesselId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PREFIX + vesselId);
}
