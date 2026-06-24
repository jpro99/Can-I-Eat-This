// src/app/api/logs/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { mapMealLog } from "@/lib/nutrition/aggregates";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const log = await prisma.mealLog.findUnique({ where: { id } });
  if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(mapMealLog(log));
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const log = await prisma.mealLog.update({
    where: { id },
    data: {
      ...(body.foodName !== undefined && { foodName: body.foodName }),
      ...(body.servings !== undefined && { servings: body.servings }),
      ...(body.mealType !== undefined && { mealType: body.mealType }),
      ...(body.calories !== undefined && { calories: body.calories }),
      ...(body.protein !== undefined && { protein: body.protein }),
      ...(body.carbs !== undefined && { carbs: body.carbs }),
      ...(body.fats !== undefined && { fats: body.fats }),
      ...(body.userCorrections !== undefined && {
        userCorrections: JSON.stringify(body.userCorrections),
      }),
    },
  });
  return NextResponse.json(mapMealLog(log));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.mealLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
