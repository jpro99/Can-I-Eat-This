// src/app/api/water/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getOrCreateProfile, prisma } from "@/lib/db";
import { calculateWaterTarget } from "@/lib/nutrition/water";
import { mapProfile } from "@/lib/profile/mapper";
import { startOfDay, endOfDay } from "@/lib/utils";

export async function GET() {
  const profile = mapProfile(await getOrCreateProfile());
  const now = new Date();
  const logs = await prisma.waterLog.findMany({
    where: {
      profileId: profile.id,
      recordedAt: { gte: startOfDay(now), lte: endOfDay(now) },
    },
    orderBy: { recordedAt: "desc" },
  });
  const consumedMl = logs.reduce((acc, l) => acc + l.amountMl, 0);
  return NextResponse.json({
    consumedMl,
    targetMl: calculateWaterTarget(profile),
    logs,
  });
}

export async function POST(req: NextRequest) {
  const { amountMl } = await req.json();
  const profile = await getOrCreateProfile();
  const entry = await prisma.waterLog.create({
    data: { profileId: profile.id, amountMl: parseInt(amountMl, 10) },
  });
  return NextResponse.json(entry);
}
