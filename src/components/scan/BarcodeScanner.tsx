// src/components/scan/BarcodeScanner.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { Button } from "@/components/ui/Button";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onError?: (message: string) => void;
}

export function BarcodeScanner({ onScan, onError }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const controlsRef = useRef<IScannerControls | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let active = true;

    async function start() {
      try {
        setScanning(true);
        controlsRef.current = await reader.decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
          if (result && active) {
            onScan(result.getText());
            controlsRef.current?.stop();
          }
        });
      } catch {
        onError?.("Could not access camera. Allow camera permission and try again.");
        setScanning(false);
      }
    }

    start();
    return () => {
      active = false;
      controlsRef.current?.stop();
    };
  }, [onScan, onError]);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-black">
      <video ref={videoRef} className="aspect-[3/4] w-full object-cover" muted playsInline />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-48 w-72 rounded-2xl border-2 border-white/70" />
      </div>
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <Button variant="secondary" size="sm" disabled={!scanning}>
          {scanning ? "Scanning…" : "Starting camera…"}
        </Button>
      </div>
    </div>
  );
}
