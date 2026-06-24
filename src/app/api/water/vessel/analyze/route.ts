// src/app/api/water/vessel/analyze/route.ts

import { NextRequest, NextResponse } from "next/server";
import { analyzeCupVolume } from "@/lib/ai/openai";

export async function POST(req: NextRequest) {
  const { imageBase64 } = await req.json();
  if (!imageBase64) {
    return NextResponse.json({ error: "Cup photo required" }, { status: 400 });
  }
  const result = await analyzeCupVolume(imageBase64);
  return NextResponse.json(result);
}
