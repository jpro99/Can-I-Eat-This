// src/app/api/kitchen/memory/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getOrCreateProfile, prisma } from "@/lib/db";
import { mapProfile, profileToDbFields } from "@/lib/profile/mapper";
import type { KitchenMemory } from "@/types";

export async function GET() {
  const profile = mapProfile(await getOrCreateProfile());
  return NextResponse.json(profile.kitchenMemory);
}

export async function PUT(req: NextRequest) {
  const body = (await req.json()) as KitchenMemory;
  const profile = await getOrCreateProfile();
  await prisma.userProfile.update({
    where: { id: profile.id },
    data: profileToDbFields({ kitchenMemory: body }),
  });
  return NextResponse.json(mapProfile(await getOrCreateProfile()).kitchenMemory);
}
