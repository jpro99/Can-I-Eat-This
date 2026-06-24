// src/app/api/barcode/[code]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { lookupBarcode } from "@/lib/barcode/open-food-facts";
import { evaluateAnalysis } from "@/lib/coach/evaluate";
import type { MealContext } from "@/types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const mealContext: MealContext | undefined = await req.json().catch(() => undefined);
  const analysis = await lookupBarcode(code);
  if (!analysis) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  const result = await evaluateAnalysis({ ...analysis, mealContext }, mealContext);
  return NextResponse.json(result);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const analysis = await lookupBarcode(code);
  if (!analysis) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  const result = await evaluateAnalysis(analysis);
  return NextResponse.json(result);
}
