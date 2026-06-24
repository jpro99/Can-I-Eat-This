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

  const handleCapture = async (blob: Blob) => {
    setProcessing(true);
    try {
      const imageBase64 = await fileToBase64(blob);
      const mealContext = getScanContext();
      const res = await fetch("/api/ai/plate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mealContext }),
      });
      const result = await res.json();
      sessionStorage.setItem(SCAN_SESSION_KEY, JSON.stringify(result));
      router.push("/scan/portion");
    } catch {
      setProcessing(false);
    }
  };

  return (
    <AppShell hideNav>
      <Header title="Plate photo" subtitle="Estimates only — confirm portions next" backHref="/scan" />
      <Card className="mb-4 border-amber-200 bg-amber-50">
        <p className="text-sm text-amber-900">
          Plate photos produce estimates, not exact values. Next you will confirm portion size for better accuracy.
        </p>
      </Card>
      {processing ? (
        <p className="py-20 text-center text-neutral-500">Analyzing your meal…</p>
      ) : (
        <CameraCapture onCapture={handleCapture} label="Capture plate" />
      )}
    </AppShell>
  );
}
