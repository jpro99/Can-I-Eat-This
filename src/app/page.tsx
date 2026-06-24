// src/app/page.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((profile) => {
        if (!profile?.onboardingComplete) router.replace("/onboarding");
        else router.replace("/today");
      })
      .catch(() => router.replace("/onboarding"));
  }, [router]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-neutral-50">
      <p className="text-neutral-500">Loading Caveman…</p>
    </div>
  );
}
