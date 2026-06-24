// src/app/api/restaurants/search/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { searchRestaurants } from "@/lib/restaurants/knowledge";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const dbRows = await prisma.restaurantKnowledge.findMany({
    where: q ? { name: { contains: q } } : undefined,
    take: 20,
  });
  const dbRestaurants = dbRows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    sodiumLevel: r.sodiumLevel as "moderate",
    gmoRisk: r.gmoRisk as "moderate",
    processingLevel: r.processingLevel as "moderate",
    notes: r.notes,
    tips: JSON.parse(r.tips || "[]") as string[],
  }));
  return NextResponse.json(searchRestaurants(q, dbRestaurants));
}
