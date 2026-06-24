// src/app/api/kitchen/venues/route.ts

import { NextRequest, NextResponse } from "next/server";
import { searchVenueCatalog, VENUE_BRANDS } from "@/lib/kitchen/venue-catalog";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  return NextResponse.json({ brands: VENUE_BRANDS, items: searchVenueCatalog(q) });
}
