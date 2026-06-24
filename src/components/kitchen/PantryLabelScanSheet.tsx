// src/components/kitchen/PantryLabelScanSheet.tsx

"use client";

import { useState } from "react";
import { CameraCapture } from "@/components/scan/CameraCapture";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { describePantryScanPrompt } from "@/lib/kitchen/pantry-label";
import { fileToBase64 } from "@/lib/utils";
import type { PantryItem, PantryItemType } from "@/types";
import { CheckCircle2, X } from "lucide-react";
import Tesseract from "tesseract.js";

interface PantryLabelScanSheetProps {
  type: PantryItemType;
  channelLabel?: string;
  onVerified: (fields: Omit<PantryItem, "id">) => void;
  onClose: () => void;
}

export function PantryLabelScanSheet({ type, channelLabel, onVerified, onClose }: PantryLabelScanSheetProps) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Omit<PantryItem, "id"> | null>(null);

  const scanBlob = async (blob: Blob) => {
    setProcessing(true);
    setError(null);
    try {
      const { data } = await Tesseract.recognize(blob, "eng");
      const imageBase64 = await fileToBase64(blob);
      const res = await fetch("/api/kitchen/pantry/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ocrText: data.text, imageBase64, pantryType: type }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not read label — try better lighting");
        return;
      }
      const item: Omit<PantryItem, "id"> = {
        name: body.name,
        type,
        calories: body.calories,
        protein: body.protein,
        carbs: body.carbs,
        fats: body.fats,
        sugar: body.sugar,
        sodium: body.sodium,
        perTsp: body.perTsp,
        brand: body.brand,
        servingSize: body.servingSize,
        labelVerified: true,
        labelScannedAt: body.labelScannedAt,
      };
      setPreview(item);
    } catch {
      setError("Could not read label — try again");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 pb-safe-bottom">
      <Card className="max-h-[92vh] w-full max-w-lg overflow-y-auto">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Photograph your product</h2>
            <p className="mt-1 text-sm text-neutral-600">{describePantryScanPrompt(type, channelLabel)}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-neutral-100">
            <X size={20} />
          </button>
        </div>

        {!preview ? (
          processing ? (
            <p className="py-16 text-center text-neutral-500">Reading nutrition label…</p>
          ) : (
            <>
              <CameraCapture onCapture={scanBlob} label="Capture nutrition label" />
              {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
            </>
          )
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-emerald-900">
              <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
              <div>
                <p className="font-medium">{preview.name}</p>
                {preview.brand && <p className="text-sm">{preview.brand}</p>}
                <p className="text-sm">
                  {preview.perTsp ? "per tsp" : "per 100ml"} · {preview.calories} cal · from your label
                </p>
              </div>
            </div>
            <Button className="w-full" size="lg" onClick={() => onVerified(preview)}>
              Use this product
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => setPreview(null)}>
              Retake photo
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
