// src/hooks/useActivitySession.ts

"use client";

import { useCallback, useRef, useState } from "react";
import { estimateActivityCalories, trackDistanceKm } from "@/lib/activity/calculator";
import type { ActivityType } from "@/types";

interface GpsPoint {
  lat: number;
  lon: number;
  at: number;
}

export function useActivitySession(weightKg: number) {
  const [active, setActive] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>("walk");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const pointsRef = useRef<GpsPoint[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  const stopInternals = useCallback(() => {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setActive(false);
  }, []);

  const start = useCallback(
    (type: ActivityType) => {
      if (!navigator.geolocation) {
        setError("GPS not available — use quick-log instead");
        return false;
      }
      setError(null);
      setActivityType(type);
      pointsRef.current = [];
      setDistanceKm(0);
      setElapsedSec(0);
      startedAtRef.current = Date.now();
      setActive(true);

      timerRef.current = setInterval(() => {
        setElapsedSec(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 1000);

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const pt = { lat: pos.coords.latitude, lon: pos.coords.longitude, at: Date.now() };
          const prev = pointsRef.current;
          if (prev.length === 0 || haversineM(prev[prev.length - 1], pt) > 0.008) {
            pointsRef.current = [...prev, pt];
            setDistanceKm(trackDistanceKm(pointsRef.current));
          }
        },
        (err) => setError(err.message || "GPS error"),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      );
      return true;
    },
    []
  );

  const stop = useCallback(() => {
    const durationMin = Math.max(elapsedSec / 60, 0.5);
    const dist = trackDistanceKm(pointsRef.current);
    const calories = estimateActivityCalories(activityType, weightKg, durationMin, dist);
    stopInternals();
    return {
      activityType,
      durationMin: Math.round(durationMin * 10) / 10,
      distanceKm: dist > 0 ? dist : undefined,
      caloriesBurned: calories,
      source: "gps" as const,
    };
  }, [activityType, elapsedSec, stopInternals, weightKg]);

  const cancel = useCallback(() => {
    stopInternals();
    setElapsedSec(0);
    setDistanceKm(0);
  }, [stopInternals]);

  return { active, activityType, elapsedSec, distanceKm, error, start, stop, cancel };
}

function haversineM(a: GpsPoint, b: GpsPoint): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
