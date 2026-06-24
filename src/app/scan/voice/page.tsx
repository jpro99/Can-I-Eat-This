// src/app/scan/voice/page.tsx

"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useSpeech } from "@/hooks/useSpeech";
import { SCAN_SESSION_KEY } from "@/lib/utils";
import { getScanContext } from "@/lib/scan/context-storage";
import { Mic, MicOff } from "lucide-react";
import { useState } from "react";

export default function VoiceInputPage() {
  const router = useRouter();
  const { listening, transcript, supported, start, stop, setTranscript } = useSpeech();
  const [loading, setLoading] = useState(false);

  const parse = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    const mealContext = getScanContext();
    const res = await fetch("/api/ai/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, mealContext }),
    });
    const result = await res.json();
    sessionStorage.setItem(SCAN_SESSION_KEY, JSON.stringify(result));
    router.push("/scan/result");
  };

  return (
    <AppShell hideNav>
      <Header title="Voice input" backHref="/scan" />

      {!supported && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-900">
            Voice recognition may not work in iOS Safari. Type your meal below instead.
          </p>
        </Card>
      )}

      <Card className="mb-4 text-center">
        <button
          type="button"
          onClick={listening ? stop : start}
          className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full transition-colors ${listening ? "bg-rose-500 text-white" : "bg-neutral-900 text-white"}`}
        >
          {listening ? <MicOff size={36} /> : <Mic size={36} />}
        </button>
        <p className="mt-4 text-sm text-neutral-500">
          {listening ? "Listening…" : "Tap to speak"}
        </p>
      </Card>

      <Input
        placeholder='e.g. "Two eggs and steak"'
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
      />

      <Button className="mt-4 w-full" size="lg" disabled={loading || !transcript.trim()} onClick={parse}>
        {loading ? "Parsing…" : "Continue"}
      </Button>
    </AppShell>
  );
}
