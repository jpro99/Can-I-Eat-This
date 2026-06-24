// src/app/api/activity/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getOrCreateProfile, prisma } from "@/lib/db";
import { mapProfile } from "@/lib/profile/mapper";
import {
  caloriesFromSteps,
  estimateActivityCalories,
} from "@/lib/activity/calculator";
import { ACTIVITY_TYPE_LABELS } from "@/lib/activity/presets";
import type { ActivityType } from "@/types";
import { endOfDay, startOfDay } from "@/lib/utils";

function mapActivity(log: {
  id: string;
  activityType: string;
  durationMin: number;
  distanceKm: number | null;
  steps: number | null;
  caloriesBurned: number;
  source: string;
  notes: string | null;
  recordedAt: Date;
}) {
  return {
    id: log.id,
    activityType: log.activityType as ActivityType,
    durationMin: log.durationMin,
    distanceKm: log.distanceKm ?? undefined,
    steps: log.steps ?? undefined,
    caloriesBurned: Math.round(log.caloriesBurned),
    source: log.source as "manual" | "gps" | "steps",
    notes: log.notes ?? undefined,
    recordedAt: log.recordedAt.toISOString(),
    label: ACTIVITY_TYPE_LABELS[log.activityType as ActivityType] ?? log.activityType,
  };
}

export async function GET(req: NextRequest) {
  const profile = mapProfile(await getOrCreateProfile());
  const day = req.nextUrl.searchParams.get("day");
  const now = day ? new Date(`${day}T12:00:00`) : new Date();

  const logs = await prisma.activityLog.findMany({
    where: {
      profileId: profile.id,
      recordedAt: { gte: startOfDay(now), lte: endOfDay(now) },
    },
    orderBy: { recordedAt: "desc" },
  });

  const caloriesBurned = logs.reduce((s, l) => s + l.caloriesBurned, 0);
  return NextResponse.json({
    activities: logs.map(mapActivity),
    caloriesBurned: Math.round(caloriesBurned),
  });
}

export async function POST(req: NextRequest) {
  const profile = mapProfile(await getOrCreateProfile());
  const body = await req.json();
  const {
    activityType,
    durationMin,
    distanceKm,
    steps,
    source = "manual",
    notes,
    recordedAt,
  } = body as {
    activityType: ActivityType;
    durationMin?: number;
    distanceKm?: number;
    steps?: number;
    source?: "manual" | "gps" | "steps";
    notes?: string;
    recordedAt?: string;
  };

  if (!activityType) {
    return NextResponse.json({ error: "activityType required" }, { status: 400 });
  }

  let caloriesBurned = 0;
  let duration = durationMin ?? 0;

  if (activityType === "steps" && steps) {
    caloriesBurned = caloriesFromSteps(steps, profile.weightKg);
    duration = duration || Math.round(steps / 100);
  } else {
    if (!duration || duration <= 0) {
      return NextResponse.json({ error: "durationMin required" }, { status: 400 });
    }
    caloriesBurned = estimateActivityCalories(activityType, profile.weightKg, duration, distanceKm);
  }

  const log = await prisma.activityLog.create({
    data: {
      profileId: profile.id,
      activityType,
      durationMin: duration,
      distanceKm: distanceKm ?? null,
      steps: steps ?? null,
      caloriesBurned,
      source,
      notes: notes ?? null,
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
    },
  });

  return NextResponse.json(mapActivity(log));
}

export async function DELETE(req: NextRequest) {
  const profile = mapProfile(await getOrCreateProfile());
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await prisma.activityLog.findFirst({ where: { id, profileId: profile.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.activityLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
