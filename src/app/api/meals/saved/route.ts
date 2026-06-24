// src/app/api/meals/saved/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getOrCreateProfile, prisma } from "@/lib/db";
import { parseJsonArray } from "@/lib/utils";

export async function GET() {
  const profile = await getOrCreateProfile();
  const meals = await prisma.savedMeal.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(
    meals.map((m) => ({ id: m.id, name: m.name, items: parseJsonArray(m.items) }))
  );
}

export async function POST(req: NextRequest) {
  const { name, items } = await req.json();
  const profile = await getOrCreateProfile();
  const meal = await prisma.savedMeal.create({
    data: { profileId: profile.id, name, items: JSON.stringify(items ?? []) },
  });
  return NextResponse.json({ id: meal.id, name: meal.name, items: items ?? [] });
}
