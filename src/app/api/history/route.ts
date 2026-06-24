// src/app/api/history/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getOrCreateProfile, prisma } from "@/lib/db";
import { buildHistorySummary } from "@/lib/nutrition/aggregates";

export async function GET(req: NextRequest) {
  const profile = await getOrCreateProfile();
  const range = req.nextUrl.searchParams.get("range") ?? "7";
  const startParam = req.nextUrl.searchParams.get("start");
  const endParam = req.nextUrl.searchParams.get("end");

  let startDate: Date;
  let endDate = new Date();

  if (startParam && endParam) {
    startDate = new Date(startParam);
    endDate = new Date(endParam);
  } else {
    const days = parseInt(range, 10) || 7;
    startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);
  }

  const logs = await prisma.mealLog.findMany({
    where: {
      profileId: profile.id,
      timestamp: { gte: startDate, lte: endDate },
    },
    orderBy: { timestamp: "asc" },
  });

  const weights = await prisma.weightEntry.findMany({
    where: {
      profileId: profile.id,
      recordedAt: { gte: startDate, lte: endDate },
    },
    orderBy: { recordedAt: "asc" },
  });

  const weightTrend = weights.map((w) => ({
    date: w.recordedAt.toISOString().slice(0, 10),
    weightKg: w.weightKg,
  }));

  return NextResponse.json(buildHistorySummary(logs, startDate, endDate, weightTrend));
}
