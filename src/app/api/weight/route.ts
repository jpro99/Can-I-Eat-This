// src/app/api/weight/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getOrCreateProfile, prisma } from "@/lib/db";
import { lbsToKg } from "@/lib/units/us";

export async function GET() {
  const profile = await getOrCreateProfile();
  const entries = await prisma.weightEntry.findMany({
    where: { profileId: profile.id },
    orderBy: { recordedAt: "desc" },
    take: 30,
  });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const weightKg =
    body.weightLbs !== undefined
      ? lbsToKg(parseFloat(body.weightLbs))
      : parseFloat(body.weightKg);

  const profile = await getOrCreateProfile();
  const entry = await prisma.weightEntry.create({
    data: { profileId: profile.id, weightKg },
  });
  await prisma.userProfile.update({
    where: { id: profile.id },
    data: { weightKg },
  });
  return NextResponse.json(entry);
}
