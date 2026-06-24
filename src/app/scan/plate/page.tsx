// src/app/scan/plate/page.tsx

"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { CameraCapture } from "@/components/scan/CameraCapture";
import { fileToBase64, SCAN_SESSION_KEY } from "@/lib/utils";
import { getScanContext } from "@/lib/scan/context-storage";
import { useState } from "react";
import { Card } from "@/components/ui/Card";

export default function PlateScanPage() {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = async (blob: Blob) => {
    setProcessing(true);
    setError(null);
    try {
      const imageBase64 = await fileToBase64(blob);
      const mealContext = getScanContext();
      const res = await fetch("/api/ai/plate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mealContext }),
      });
      if (!res.ok) {
        setError("Could not analyze this photo. Try again with better lighting.");
        setProcessing(false);
        return;
      }
      const result = await res.json();
      sessionStorage.setItem(SCAN_SESSION_KEY, JSON.stringify(result));
      router.push("/scan/result");
    } catch {
      setError("Analysis failed. Check your connection and try again.");
      setProcessing(false);
    }
  };

  return (
    <AppShell hideNav>
      <Header title="Snap your meal" subtitle="Photo → calories, protein, carbs & more" backHref="/scan" />
      <Card className="mb-4 border-blue-200 bg-blue-50">
        <p className="text-sm text-blue-900">
          Point at your plate or upload a photo. We identify each food, estimate portions in cups and ounces, and calculate full nutrition. You can fine-tune on the next screen.
        </p>
      </Card>
      {processing ? (
        <div className="py-20 text-center">
          <p className="text-lg font-medium text-neutral-700">Analyzing your meal…</p>
          <p className="mt-2 text-sm text-neutral-500">Identifying foods and calculating macros</p>
        </div>
      ) : (
        <CameraCapture onCapture={handleCapture} label="Take photo" />
      )}
      {error && <p className="mt-4 text-center text-sm text-rose-600">{error}</p>}
    </AppShell>
  );
}
