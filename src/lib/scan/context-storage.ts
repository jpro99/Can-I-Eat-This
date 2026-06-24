// src/lib/scan/context-storage.ts

import type { MealContext } from "@/types";
import { SCAN_CONTEXT_KEY } from "@/lib/utils";

export function getScanContext(): MealContext {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(SCAN_CONTEXT_KEY);
    return raw ? (JSON.parse(raw) as MealContext) : {};
  } catch {
    return {};
  }
}

export function setScanContext(ctx: MealContext) {
  sessionStorage.setItem(SCAN_CONTEXT_KEY, JSON.stringify(ctx));
}

export function mealContextHeaders() {
  const ctx = getScanContext();
  return ctx;
}
