// src/app/api/profile/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getOrCreateProfile, prisma } from "@/lib/db";
import { mapProfile, profileToDbFields } from "@/lib/profile/mapper";
import { suggestMacros } from "@/lib/nutrition/calculator";

function dbConfigHint(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes("kitchenMemory") || msg.includes("dailyRoutines") || msg.includes("column")) {
    return "Database schema is out of date. Run: npm run db:push";
  }
  return msg;
}

export async function GET() {
  try {
    const profile = await getOrCreateProfile();
    return NextResponse.json(mapProfile(profile));
  } catch (error) {
    console.error("[profile GET]", error);
    return NextResponse.json({ error: dbConfigHint(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
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
  } catch (error) {
    console.error("[profile PUT]", error);
    return NextResponse.json({ error: dbConfigHint(error) }, { status: 500 });
  }
}
