// src/app/scan/label/page.tsx

"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { CameraCapture } from "@/components/scan/CameraCapture";
import { fileToBase64, SCAN_SESSION_KEY } from "@/lib/utils";
import { getScanContext } from "@/lib/scan/context-storage";
import { useState } from "react";
import Tesseract from "tesseract.js";

export default function LabelScanPage() {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  const handleCapture = async (blob: Blob) => {
    setProcessing(true);
    try {
      const { data } = await Tesseract.recognize(blob, "eng");
      const imageBase64 = await fileToBase64(blob);
      const mealContext = getScanContext();
      const res = await fetch("/api/ocr/label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ocrText: data.text, imageBase64, mealContext }),
      });
      const result = await res.json();
      sessionStorage.setItem(SCAN_SESSION_KEY, JSON.stringify(result));
      router.push("/scan/result");
    } catch {
      setProcessing(false);
    }
  };

  return (
    <AppShell hideNav>
      <Header title="Label photo" subtitle="Point at nutrition facts & ingredients" backHref="/scan" />
      {processing ? (
        <p className="py-20 text-center text-neutral-500">Reading label…</p>
      ) : (
        <CameraCapture onCapture={handleCapture} label="Capture label" />
      )}
    </AppShell>
  );
}
