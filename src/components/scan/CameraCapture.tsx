// src/components/scan/CameraCapture.tsx

"use client";

import { useCamera } from "@/hooks/useCamera";
import { Button } from "@/components/ui/Button";
import { Camera } from "lucide-react";
import { useEffect } from "react";

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  label?: string;
}

export function CameraCapture({ onCapture, label = "Capture" }: CameraCaptureProps) {
  const { videoRef, active, error, start, stop, capture } = useCamera();

  useEffect(() => {
    start();
  }, [start]);

  const handleCapture = async () => {
    const blob = await capture();
    if (blob) {
      stop();
      onCapture(blob);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl bg-black">
        <video ref={videoRef} className="aspect-[3/4] w-full object-cover" muted playsInline />
        {!active && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            Starting camera…
          </div>
        )}
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <Button size="xl" className="w-full" onClick={handleCapture} disabled={!active}>
        <Camera size={22} />
        {label}
      </Button>
    </div>
  );
}
