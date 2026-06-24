// src/app/api/coach/today/route.ts

import { NextResponse } from "next/server";
import { loadDailyCoachContext } from "@/lib/coach/daily-context";
import { generateDailyInsights } from "@/lib/coach/daily-coach";
import { buildMicronutrientStatus } from "@/lib/nutrition/micronutrients";

export async function GET() {
  const ctx = await loadDailyCoachContext();
  const insights = generateDailyInsights(ctx);
  const micronutrientStatus = buildMicronutrientStatus(
    ctx.consumed.micronutrients ?? {},
    ctx.targets.micronutrients ?? {}
  );
  return NextResponse.json({ insights, micronutrientStatus, context: {
    proteinConsumed: ctx.consumed.protein,
    proteinTarget: ctx.targets.protein,
    proteinRemaining: ctx.remaining.protein,
    waterConsumedMl: ctx.waterConsumedMl,
    waterTargetMl: ctx.waterTargetMl,
  }});
}
