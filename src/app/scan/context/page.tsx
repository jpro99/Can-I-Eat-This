// src/app/scan/context/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { MealContext, MealOrigin, RestaurantInfo } from "@/types";
import { setScanContext } from "@/lib/scan/context-storage";
import { Home, ShoppingBag, UtensilsCrossed } from "lucide-react";

const ORIGINS: { id: MealOrigin; label: string; icon: typeof Home; desc: string; next: string }[] = [
  { id: "homemade", label: "Homemade", icon: Home, desc: "You cooked it — best accuracy with portions", next: "/scan/plate" },
  { id: "store", label: "Store-bought", icon: ShoppingBag, desc: "Packaged food — barcode or label", next: "/scan/barcode" },
  { id: "restaurant", label: "Restaurant", icon: UtensilsCrossed, desc: "Dining out — we apply restaurant intel", next: "/scan/plate" },
];

export default function ScanContextPage() {
  const router = useRouter();
  const [origin, setOrigin] = useState<MealOrigin | null>(null);
  const [restaurantQuery, setRestaurantQuery] = useState("");
  const [restaurants, setRestaurants] = useState<RestaurantInfo[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantInfo | null>(null);

  useEffect(() => {
    if (origin !== "restaurant") return;
    const t = setTimeout(() => {
      fetch(`/api/restaurants/search?q=${encodeURIComponent(restaurantQuery)}`)
        .then((r) => r.json())
        .then(setRestaurants);
    }, 200);
    return () => clearTimeout(t);
  }, [restaurantQuery, origin]);

  const continueFlow = () => {
    if (!origin) return;
    const ctx: MealContext = {
      mealOrigin: origin,
      restaurantName: selectedRestaurant?.name ?? (origin === "restaurant" ? restaurantQuery : undefined),
    };
    setScanContext(ctx);
    const route = ORIGINS.find((o) => o.id === origin)?.next ?? "/scan";
    router.push(route);
  };

  return (
    <AppShell hideNav>
      <Header title="Where is this from?" subtitle="This makes your advice much smarter" backHref="/scan" />

      <div className="space-y-3">
        {ORIGINS.map((o) => {
          const Icon = o.icon;
          const selected = origin === o.id;
          return (
            <button key={o.id} type="button" onClick={() => setOrigin(o.id)}>
              <Card className={`flex items-center gap-4 text-left transition-all ${selected ? "border-neutral-900 ring-2 ring-neutral-900" : ""}`}>
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${selected ? "bg-neutral-900 text-white" : "bg-neutral-100"}`}>
                  <Icon size={26} />
                </div>
                <div>
                  <h3 className="font-semibold">{o.label}</h3>
                  <p className="text-sm text-neutral-500">{o.desc}</p>
                </div>
              </Card>
            </button>
          );
        })}
      </div>

      {origin === "restaurant" && (
        <Card className="mt-4 space-y-3">
          <Input
            placeholder="Restaurant name (e.g. Chipotle)"
            value={restaurantQuery}
            onChange={(e) => setRestaurantQuery(e.target.value)}
          />
          {restaurants.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedRestaurant(r)}
              className={`w-full rounded-2xl border p-3 text-left ${selectedRestaurant?.id === r.id ? "border-neutral-900 bg-neutral-50" : "border-neutral-200"}`}
            >
              <p className="font-medium">{r.name}</p>
              <p className="text-xs text-neutral-500">{r.notes.slice(0, 80)}…</p>
            </button>
          ))}
        </Card>
      )}

      <Button className="mt-6 w-full" size="lg" disabled={!origin} onClick={continueFlow}>
        Continue
      </Button>
    </AppShell>
  );
}
