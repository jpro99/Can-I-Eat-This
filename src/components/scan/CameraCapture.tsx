// src/components/scan/CameraCapture.tsx

"use client";

import { useCamera } from "@/hooks/useCamera";
import { Button } from "@/components/ui/Button";
import { Camera, ImagePlus } from "lucide-react";
import { useEffect, useRef } from "react";

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  label?: string;
}

export function CameraCapture({ onCapture, label = "Capture" }: CameraCaptureProps) {
  const { videoRef, active, error, start, stop, capture } = useCamera();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    stop();
    onCapture(file);
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
      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={() => fileInputRef.current?.click()}
      >
        <ImagePlus size={20} />
        Choose from photos
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
