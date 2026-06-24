// src/components/pwa/InstallPrompt.tsx

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone || dismissed) return null;

  if (isIOS) {
    return (
      <Card className="mb-4 border-emerald-200 bg-emerald-50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-emerald-900">Install Caveman</p>
            <p className="mt-1 text-sm text-emerald-800">
              Tap Share → Add to Home Screen for full-screen app experience.
            </p>
          </div>
          <button onClick={() => setDismissed(true)} aria-label="Dismiss">
            <X size={18} className="text-emerald-700" />
          </button>
        </div>
      </Card>
    );
  }

  if (!deferred) return null;

  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">Install Caveman</p>
          <p className="text-sm text-neutral-500">Add to your home screen for the best experience.</p>
        </div>
        <Button
          size="sm"
          onClick={async () => {
            await deferred.prompt();
            setDeferred(null);
          }}
        >
          <Download size={16} />
          Install
        </Button>
      </div>
    </Card>
  );
}
