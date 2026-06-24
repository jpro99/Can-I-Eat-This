// src/app/api/kitchen/appliances/route.ts

import { NextRequest, NextResponse } from "next/server";
import { APPLIANCE_MANUFACTURERS, searchApplianceCatalog } from "@/lib/kitchen/appliance-catalog";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const models = searchApplianceCatalog(q);
  return NextResponse.json({ manufacturers: APPLIANCE_MANUFACTURERS, models });
}
