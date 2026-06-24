// src/components/water/WaterLogSheet.tsx

"use client";

import { useEffect, useState } from "react";
import { CameraCapture } from "@/components/scan/CameraCapture";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { getDefaultVessel, hasSetupVessel, newVesselId } from "@/lib/water/vessels";
import { getVesselPhoto, saveVesselPhoto } from "@/lib/water/vessel-photos";
import { flOzToMl, formatWaterFlOz } from "@/lib/units/us";
import { fileToBase64 } from "@/lib/utils";
import type { WaterVessel } from "@/types";
import { Camera, CheckCircle2, Droplets, X } from "lucide-react";

type Step = "same-cup" | "setup" | "custom-oz" | "pick-vessel";

interface WaterLogSheetProps {
  vessels: WaterVessel[];
  defaultVesselId?: string | null;
  onClose: () => void;
  onLogged: () => void;
  onVesselsChange: (vessels: WaterVessel[], defaultVesselId: string | null) => Promise<void>;
}

export function WaterLogSheet({
  vessels,
  defaultVesselId,
  onClose,
  onLogged,
  onVesselsChange,
}: WaterLogSheetProps) {
  const defaultVessel = getDefaultVessel(vessels, defaultVesselId);
  const [step, setStep] = useState<Step>(() => (hasSetupVessel(vessels) ? "same-cup" : "setup"));
  const [activeVessel, setActiveVessel] = useState<WaterVessel | undefined>(defaultVessel);
  const [customFlOz, setCustomFlOz] = useState("8");
  const [vesselName, setVesselName] = useState("My cup");
  const [setupFlOz, setSetupFlOz] = useState("8");
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    defaultVessel ? getVesselPhoto(defaultVessel.id) : null
  );
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (activeVessel) {
      setPhotoPreview(getVesselPhoto(activeVessel.id));
    }
  }, [activeVessel]);

  const logMl = async (amountMl: number, vesselId?: string) => {
    setSaving(true);
    try {
      await fetch("/api/water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountMl, vesselId }),
      });
      onLogged();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const logFromVessel = async (vessel: WaterVessel, count: number) => {
    await logMl(Math.round(flOzToMl(vessel.volumeFlOz) * count), vessel.id);
  };

  const captureCupPhoto = async (blob: Blob) => {
    setProcessing(true);
    try {
      const imageBase64 = await fileToBase64(blob);
      setPendingPhoto(`data:image/jpeg;base64,${imageBase64}`);
      const res = await fetch("/api/water/vessel/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });
      const data = await res.json();
      if (res.ok) {
        setSetupFlOz(String(Math.round(data.estimatedFlOz)));
        setVesselName(data.cupDescription || "My cup");
      }
    } finally {
      setProcessing(false);
    }
  };

  const saveNewVessel = async () => {
    const flOz = parseFloat(setupFlOz);
    if (!flOz || flOz <= 0) return;
    const vessel: WaterVessel = {
      id: newVesselId(),
      name: vesselName.trim() || "My cup",
      volumeFlOz: flOz,
      photoSetupComplete: !!pendingPhoto,
      createdAt: new Date().toISOString(),
    };
    if (pendingPhoto) saveVesselPhoto(vessel.id, pendingPhoto);
    const next = [...vessels.filter((v) => v.id !== vessel.id), vessel];
    await onVesselsChange(next, vessel.id);
    setActiveVessel(vessel);
    setPhotoPreview(pendingPhoto);
    await logMl(Math.round(flOzToMl(flOz)), vessel.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 pb-safe-bottom">
      <Card className="max-h-[92vh] w-full max-w-lg overflow-y-auto">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Log water</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-neutral-100">
            <X size={20} />
          </button>
        </div>

        {step === "same-cup" && activeVessel && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-700">
              Same cup? Tap how many times you filled it today.
            </p>
            <div className="flex items-center gap-3 rounded-2xl bg-blue-50 p-3">
              {photoPreview ? (
                <img src={photoPreview} alt="" className="h-16 w-16 rounded-xl object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-100 text-2xl">🥤</div>
              )}
              <div>
                <p className="font-medium">{activeVessel.name}</p>
                <p className="text-sm text-neutral-600">{activeVessel.volumeFlOz} fl oz each fill</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <Button
                  key={n}
                  variant={n === 1 ? "primary" : "secondary"}
                  disabled={saving}
                  onClick={() => void logFromVessel(activeVessel, n)}
                >
                  ×{n}
                </Button>
              ))}
            </div>
            <p className="text-center text-xs text-neutral-500">
              ×3 = {formatWaterFlOz(flOzToMl(activeVessel.volumeFlOz) * 3)} total
            </p>
            <div className="flex flex-col gap-2 border-t border-neutral-100 pt-3">
              <Button variant="secondary" onClick={() => setStep("pick-vessel")}>
                Different cup
              </Button>
              <Button variant="secondary" onClick={() => setStep("custom-oz")}>
                Custom ounces today
              </Button>
              <Button variant="secondary" onClick={() => { setPendingPhoto(null); setStep("setup"); }}>
                <Camera size={16} />
                Add new cup photo
              </Button>
            </div>
          </div>
        )}

        {step === "setup" && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-700">
              First time — photograph your usual cup or glass. We&apos;ll remember it and ask &quot;Same cup?&quot; next time.
            </p>
            {!pendingPhoto ? (
              processing ? (
                <p className="py-12 text-center text-neutral-500">Analyzing your cup…</p>
              ) : (
                <CameraCapture onCapture={captureCupPhoto} label="Photograph your cup" />
              )
            ) : (
              <>
                <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-emerald-900">
                  <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
                  <div>
                    <p className="font-medium">Cup saved</p>
                    <p className="text-sm">Confirm the size — you can adjust fl oz.</p>
                  </div>
                </div>
                <img src={pendingPhoto} alt="Your cup" className="mx-auto h-32 rounded-2xl object-cover" />
                <label className="mb-1 block text-sm font-medium">Cup name</label>
                <Input placeholder="Kitchen glass" value={vesselName} onChange={(e) => setVesselName(e.target.value)} />
                <div>
                  <label className="mb-1 block text-sm font-medium">How many fl oz does this cup hold?</label>
                  <Input
                    type="number"
                    step="0.5"
                    min="1"
                    max="64"
                    value={setupFlOz}
                    onChange={(e) => setSetupFlOz(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-neutral-500">When full — adjust if you only fill it partway each time.</p>
                </div>
                <Button className="w-full" size="lg" disabled={saving} onClick={() => void saveNewVessel()}>
                  Save cup & log 1 fill
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => setPendingPhoto(null)}>
                  Retake photo
                </Button>
              </>
            )}
            {hasSetupVessel(vessels) && (
              <Button variant="secondary" className="w-full" onClick={() => setStep("same-cup")}>
                Back
              </Button>
            )}
          </div>
        )}

        {step === "custom-oz" && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-700">How many fl oz did you drink?</p>
            <Input
              type="number"
              step="0.5"
              min="1"
              value={customFlOz}
              onChange={(e) => setCustomFlOz(e.target.value)}
            />
            <Button
              className="w-full"
              disabled={saving}
              onClick={() => void logMl(Math.round(flOzToMl(parseFloat(customFlOz) || 0)))}
            >
              Log {customFlOz || "0"} fl oz
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => setStep(activeVessel ? "same-cup" : "setup")}>
              Back
            </Button>
          </div>
        )}

        {step === "pick-vessel" && (
          <div className="space-y-3">
            <p className="text-sm text-neutral-700">Which cup today?</p>
            {vessels.filter((v) => v.photoSetupComplete).map((v) => {
              const photo = getVesselPhoto(v.id);
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setActiveVessel(v);
                    setPhotoPreview(photo);
                    setStep("same-cup");
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200 p-3 text-left hover:bg-neutral-50"
                >
                  {photo ? (
                    <img src={photo} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <span className="text-2xl">🥤</span>
                  )}
                  <div>
                    <p className="font-medium">{v.name}</p>
                    <p className="text-sm text-neutral-500">{v.volumeFlOz} fl oz</p>
                  </div>
                </button>
              );
            })}
            <Button variant="secondary" className="w-full" onClick={() => { setPendingPhoto(null); setStep("setup"); }}>
              <Camera size={16} />
              Photograph a new cup
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => setStep("custom-oz")}>
              Enter ounces only
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
