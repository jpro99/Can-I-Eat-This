// src/lib/utils.ts

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { MealType } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseJsonArray<T = string>(value: string, fallback: T[] = []): T[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function formatNumber(n: number, decimals = 0): string {
  return n.toFixed(decimals);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function detectMealType(date = new Date()): MealType {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 15) return "lunch";
  if (hour >= 15 && hour < 17) return "snack";
  if (hour >= 17 && hour < 22) return "dinner";
  return "snack";
}

export function mealTypeLabel(type: MealType): string {
  const labels: Record<MealType, string> = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    snack: "Snack",
  };
  return labels[type];
}

export function verdictColor(verdict: string): string {
  switch (verdict) {
    case "eat":
      return "text-emerald-600";
    case "caution":
      return "text-amber-600";
    case "avoid":
      return "text-rose-600";
    default:
      return "text-neutral-600";
  }
}

export function verdictBg(verdict: string): string {
  switch (verdict) {
    case "eat":
      return "bg-emerald-50 border-emerald-200";
    case "caution":
      return "bg-amber-50 border-amber-200";
    case "avoid":
      return "bg-rose-50 border-rose-200";
    default:
      return "bg-neutral-50 border-neutral-200";
  }
}

export function verdictLabel(verdict: string): string {
  switch (verdict) {
    case "eat":
      return "Eat";
    case "caution":
      return "Caution";
    case "avoid":
      return "Avoid";
    default:
      return "Review";
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export const SCAN_SESSION_KEY = "caveman_scan_session";
export const SCAN_CONTEXT_KEY = "caveman_scan_context";
