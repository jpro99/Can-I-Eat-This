// src/app/api/profile/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getOrCreateProfile, prisma } from "@/lib/db";
import { mapProfile, profileToDbFields } from "@/lib/profile/mapper";
import { suggestMacros } from "@/lib/nutrition/calculator";

export async function GET() {
  const profile = await getOrCreateProfile();
  return NextResponse.json(mapProfile(profile));
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const profile = await getOrCreateProfile();
  const updated = await prisma.userProfile.update({
    where: { id: profile.id },
    data: profileToDbFields(body),
  });
  const mapped = mapProfile(updated);

  if (!body.targetCalories && body.healthGoal) {
    const suggested = suggestMacros(mapped);
    const withTargets = await prisma.userProfile.update({
      where: { id: profile.id },
      data: {
        targetCalories: suggested.calories,
        targetProtein: suggested.protein,
        targetCarbs: suggested.carbs,
        targetFats: suggested.fats,
        targetFiber: suggested.fiber,
        targetSodium: suggested.sodium,
        targetSugar: suggested.sugar,
      },
    });
    return NextResponse.json(mapProfile(withTargets));
  }

  return NextResponse.json(mapped);
}
