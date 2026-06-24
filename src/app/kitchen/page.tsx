// src/app/kitchen/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useProfile } from "@/hooks/useProfile";
import type {
  ApplianceCatalogModel,
  ConfiguredAppliance,
  KitchenMemory,
  MealTemplate,
  PantryItem,
  PantryItemType,
  SpiceSet,
  VenueOrderTemplate,
} from "@/types";
import { findCatalogModel, getManufacturerName } from "@/lib/kitchen/appliance-catalog";
import { findVenueCatalogItem, VENUE_CATALOG } from "@/lib/kitchen/venue-catalog";
import { defaultNutritionForPantryType, PANTRY_TYPE_LABELS } from "@/lib/kitchen/pantry-nutrition";
import { newId } from "@/lib/kitchen/defaults";
import { describeApplianceShort } from "@/lib/kitchen/appliance-calculator";
import { ChevronRight, Coffee, Store, UtensilsCrossed, Leaf } from "lucide-react";

type Tab = "appliance" | "pantry" | "venue" | "template" | "spice";

export default function KitchenPage() {
  const { profile, update } = useProfile();
  const [km, setKm] = useState<KitchenMemory | null>(null);
  const [tab, setTab] = useState<Tab>("appliance");
  const [machineQuery, setMachineQuery] = useState("");
  const [catalog, setCatalog] = useState<ApplianceCatalogModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<ApplianceCatalogModel | null>(null);
  const [channelSeconds, setChannelSeconds] = useState<Record<string, number>>({});
  const [channelPantry, setChannelPantry] = useState<Record<string, string>>({});
  const [nickname, setNickname] = useState("");
  const [venueQuery, setVenueQuery] = useState("");

  useEffect(() => {
    if (profile) setKm(profile.kitchenMemory);
  }, [profile]);

  useEffect(() => {
    fetch(`/api/kitchen/appliances?q=${encodeURIComponent(machineQuery)}`)
      .then((r) => r.json())
      .then((d) => setCatalog(d.models));
  }, [machineQuery]);

  const saveKm = async (next: KitchenMemory) => {
    setKm(next);
    await update({ kitchenMemory: next });
  };

  if (!km) return null;

  const selectModel = (m: ApplianceCatalogModel) => {
    setSelectedModel(m);
    setNickname(m.fullName);
    const secs: Record<string, number> = {};
    const pant: Record<string, string> = {};
    for (const ch of m.channels) {
      secs[ch.id] = ch.id === "cream" ? 4 : ch.id === "milk" ? 6 : 3;
      const pantry = km.pantryItems.find((p) => p.type === ch.defaultLiquidType);
      if (pantry) pant[ch.id] = pantry.id;
    }
    setChannelSeconds(secs);
    setChannelPantry(pant);
  };

  const saveAppliance = () => {
    if (!selectedModel) return;
    const app: ConfiguredAppliance = {
      id: newId("app"),
      catalogModelId: selectedModel.id,
      nickname,
      channelSeconds,
      channelPantryIds: channelPantry,
      calibrationFactor: 1,
      includeEspresso: true,
      showInMorning: true,
      vesselLabel: "My mug",
    };
    void saveKm({
      ...km,
      setupComplete: true,
      appliances: [...km.appliances, app],
    });
    setSelectedModel(null);
    setMachineQuery("");
  };

  const addPantry = (type: PantryItemType) => {
    const n = defaultNutritionForPantryType(type);
    const item: PantryItem = {
      id: newId("pantry"),
      name: PANTRY_TYPE_LABELS[type],
      type,
      calories: n.calories,
      protein: n.protein,
      carbs: n.carbs,
      fats: n.fats,
      sugar: n.sugar,
      sodium: n.sodium,
      perTsp: n.perTsp,
    };
    void saveKm({ ...km, pantryItems: [...km.pantryItems, item] });
  };

  const addVenueFromCatalog = (catalogId: string) => {
    const item = findVenueCatalogItem(catalogId);
    if (!item) return;
    const order: VenueOrderTemplate = {
      id: newId("venue"),
      venueId: item.venueId,
      venueName: item.venueName,
      itemName: item.itemName,
      size: item.size,
      customizations: item.customizations,
      nutrition: item.nutrition,
      showInMorning: item.venueId === "starbucks" || item.venueId === "mcdonalds",
    };
    void saveKm({ ...km, setupComplete: true, venueOrders: [...km.venueOrders, order] });
  };

  const addMealTemplate = () => {
    const tpl: MealTemplate = {
      id: newId("meal"),
      name: "Usual dinner",
      mealType: "dinner",
      nutrition: { calories: 450, protein: 35, carbs: 30, fats: 18, sodium: 400, fiber: 6 },
      ingredients: "Homemade — update after first plate photo",
      showAtHours: [17, 18, 19],
    };
    void saveKm({ ...km, setupComplete: true, mealTemplates: [...km.mealTemplates, tpl] });
  };

  const addSpiceSet = () => {
    const spices = km.pantryItems.filter((p) => p.type === "spice");
    const set: SpiceSet = {
      id: newId("spice"),
      name: "My usual spices",
      pantryItemIds: spices.map((s) => s.id),
      tspPerMeal: 1,
    };
    void saveKm({ ...km, setupComplete: true, spiceSets: [...km.spiceSets, set] });
  };

  const tabs: { id: Tab; label: string; icon: typeof Coffee }[] = [
    { id: "appliance", label: "Machines", icon: Coffee },
    { id: "pantry", label: "Pantry", icon: Leaf },
    { id: "venue", label: "Starbucks & chains", icon: Store },
    { id: "template", label: "Meals", icon: UtensilsCrossed },
    { id: "spice", label: "Spices", icon: Leaf },
  ];

  return (
    <AppShell hideNav>
      <Header title="Kitchen Memory" subtitle="Set up once — accurate every day" backHref="/today" />

      <Card className="mb-4">
        <p className="text-sm text-neutral-600">
          Tell Caveman about your coffee machine (seconds of milk & cream), pantry, chain orders, and usual homemade meals. We look up manufacturer dispense rates and calibrate to your pours.
        </p>
      </Card>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1 rounded-full px-4 py-2 text-sm ${tab === t.id ? "bg-neutral-900 text-white" : "bg-neutral-100"}`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "appliance" && (
        <div className="space-y-4">
          {km.appliances.map((a) => {
            const m = findCatalogModel(a.catalogModelId);
            return (
              <Card key={a.id}>
                <p className="font-semibold">{a.nickname}</p>
                <p className="text-sm text-neutral-500">
                  {m ? getManufacturerName(m.manufacturerId) : ""} {m?.name} · {describeApplianceShort(a)}
                </p>
              </Card>
            );
          })}

          {!selectedModel ? (
            <Card className="space-y-3">
              <p className="font-medium">Add coffee machine</p>
              <Input placeholder="Search Jura, Breville, Keurig…" value={machineQuery} onChange={(e) => setMachineQuery(e.target.value)} />
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {catalog.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => selectModel(m)}
                    className="w-full rounded-2xl border border-neutral-200 p-3 text-left hover:bg-neutral-50"
                  >
                    <p className="font-medium">{m.fullName}</p>
                    <p className="text-xs text-neutral-500">
                      {getManufacturerName(m.manufacturerId)} · {m.channels.map((c) => c.label).join(", ") || "Coffee only"}
                    </p>
                  </button>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="space-y-4">
              <p className="font-semibold">{selectedModel.fullName}</p>
              {selectedModel.notes && <p className="text-sm text-amber-800 bg-amber-50 rounded-xl p-3">{selectedModel.notes}</p>}
              <Input placeholder="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
              {selectedModel.channels.map((ch) => (
                <div key={ch.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{ch.label} — default seconds</span>
                    <span>{channelSeconds[ch.id] ?? 0}s</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={ch.maxSeconds}
                    step={0.5}
                    value={channelSeconds[ch.id] ?? 0}
                    onChange={(e) => setChannelSeconds({ ...channelSeconds, [ch.id]: parseFloat(e.target.value) })}
                    className="w-full accent-neutral-900"
                  />
                  <select
                    className="mt-2 w-full rounded-xl border border-neutral-200 p-2 text-sm"
                    value={channelPantry[ch.id] ?? ""}
                    onChange={(e) => setChannelPantry({ ...channelPantry, [ch.id]: e.target.value })}
                  >
                    <option value="">Linked pantry item</option>
                    {km.pantryItems.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <p className="text-xs text-neutral-500">
                Tip: Run a 3-second cream pour once and adjust until nutrition matches your taste — saved forever.
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setSelectedModel(null)}>
                  Back
                </Button>
                <Button className="flex-1" onClick={saveAppliance}>
                  Save machine
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === "pantry" && (
        <div className="space-y-4">
          <Card>
            <p className="mb-3 text-sm text-neutral-600">Link what&apos;s in your fridge. Photo notes optional — nutrition defaults are USDA-based.</p>
            <div className="flex flex-wrap gap-2">
              {(["whole_milk", "cream", "half_and_half", "oat_milk", "spice", "sauce"] as PantryItemType[]).map((t) => (
                <Button key={t} variant="secondary" size="sm" onClick={() => addPantry(t)}>
                  + {PANTRY_TYPE_LABELS[t]}
                </Button>
              ))}
            </div>
          </Card>
          {km.pantryItems.map((p) => (
            <Card key={p.id}>
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-neutral-500">
                {p.perTsp ? "per tsp" : "per 100ml"} · {p.calories} cal
              </p>
            </Card>
          ))}
        </div>
      )}

      {tab === "venue" && (
        <div className="space-y-4">
          <Input placeholder="Search Starbucks, McDonald's…" value={venueQuery} onChange={(e) => setVenueQuery(e.target.value)} />
          {km.venueOrders.map((v) => (
            <Card key={v.id}>
              <p className="font-medium">{v.venueName} — {v.itemName}</p>
              <p className="text-sm text-neutral-500">{v.nutrition.calories} cal · {v.size}</p>
            </Card>
          ))}
          {VENUE_CATALOG.filter(
            (v) =>
              !venueQuery ||
              v.venueName.toLowerCase().includes(venueQuery.toLowerCase()) ||
              v.itemName.toLowerCase().includes(venueQuery.toLowerCase())
          )
            .slice(0, 12)
            .map((v) => (
              <button key={v.id} type="button" onClick={() => addVenueFromCatalog(v.id)} className="w-full text-left">
                <Card className="flex items-center justify-between active:scale-[0.99]">
                  <div>
                    <p className="font-medium">{v.itemName}</p>
                    <p className="text-sm text-neutral-500">{v.venueName} · {v.nutrition.calories} cal</p>
                  </div>
                  <ChevronRight size={18} className="text-neutral-400" />
                </Card>
              </button>
            ))}
        </div>
      )}

      {tab === "template" && (
        <div className="space-y-4">
          <Card>
            <p className="text-sm text-neutral-600 mb-3">
              Save homemade meals you repeat. After first plate photo, save as template — tomorrow is one tap.
            </p>
            <Button onClick={addMealTemplate}>+ Add meal template</Button>
            <Link href="/scan/plate" className="mt-2 block">
              <Button variant="secondary" className="w-full">Photo first meal to refine</Button>
            </Link>
          </Card>
          {km.mealTemplates.map((t) => (
            <Card key={t.id}>
              <p className="font-medium">{t.name}</p>
              <p className="text-sm text-neutral-500">{t.nutrition.calories} cal · {t.nutrition.protein}g protein</p>
            </Card>
          ))}
        </div>
      )}

      {tab === "spice" && (
        <div className="space-y-4">
          <Card>
            <p className="text-sm text-neutral-600 mb-3">
              Add spices under Pantry, then group them here. Same spices every meal = same nutrition automatically.
            </p>
            <Button onClick={addSpiceSet} disabled={!km.pantryItems.some((p) => p.type === "spice")}>
              + Create spice set from pantry
            </Button>
          </Card>
          {km.spiceSets.map((s) => (
            <Card key={s.id}>
              <p className="font-medium">{s.name}</p>
              <p className="text-sm text-neutral-500">{s.tspPerMeal} tsp combined per meal</p>
            </Card>
          ))}
        </div>
      )}

      <Link href="/today" className="mt-8 block">
        <Button size="lg" className="w-full">
          Done — back to Today
        </Button>
      </Link>
    </AppShell>
  );
}
