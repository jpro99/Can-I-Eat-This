// src/hooks/useProfile.ts

"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeProfile } from "@/lib/profile/normalize";
import type { UserProfileData } from "@/types";

export function useProfile() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = normalizeProfile(await res.json());
        setProfile(data);
        localStorage.setItem("caveman_profile", JSON.stringify(data));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = localStorage.getItem("caveman_profile");
    if (cached) {
      try {
        setProfile(normalizeProfile(JSON.parse(cached)));
      } catch {
        /* ignore */
      }
    }
    refresh();
  }, [refresh]);

  const update = async (data: Partial<UserProfileData>) => {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = normalizeProfile(await res.json());
      setProfile(updated);
      localStorage.setItem("caveman_profile", JSON.stringify(updated));
      return updated;
    }
    throw new Error("Failed to update profile");
  };

  return { profile, loading, refresh, update };
}
