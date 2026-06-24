// src/app/scan/barcode/page.tsx

"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { BarcodeScanner } from "@/components/scan/BarcodeScanner";
import { SCAN_SESSION_KEY } from "@/lib/utils";
import { getScanContext } from "@/lib/scan/context-storage";
import { useState } from "react";

export default function BarcodeScanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (code: string) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const mealContext = getScanContext();
      const res = await fetch(`/api/barcode/${encodeURIComponent(code)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mealContext),
      });
      if (!res.ok) {
        setError("Product not found. Try label photo or manual search.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      sessionStorage.setItem(SCAN_SESSION_KEY, JSON.stringify(data));
      router.push("/scan/result");
    } catch {
      setError("Scan failed. Check connection and try again.");
      setLoading(false);
    }
  };

  return (
    <AppShell hideNav>
      <Header title="Scan barcode" backHref="/scan" />
      <BarcodeScanner onScan={handleScan} onError={setError} />
      {loading && <p className="mt-4 text-center text-neutral-500">Looking up product…</p>}
      {error && <p className="mt-4 text-center text-sm text-rose-600">{error}</p>}
    </AppShell>
  );
}
