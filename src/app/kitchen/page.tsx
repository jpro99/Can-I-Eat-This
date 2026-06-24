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
import { findCatalogModel, getManufacturerName, applyDrinkPreset, getDrinkPresets } from "@/lib/kitchen/appliance-catalog";
import { findVenueCatalogItem, VENUE_CATALOG } from "@/lib/kitchen/venue-catalog";
import { PANTRY_TYPE_LABELS } from "@/lib/kitchen/pantry-nutrition";
import { newId } from "@/lib/kitchen/defaults";
import { describeApplianceShort } from "@/lib/kitchen/appliance-calculator";
import { defaultChannelMaxSeconds } from "@/lib/kitchen/appliance-sliders";
import { ApplianceChannelSliders } from "@/components/kitchen/ApplianceChannelSliders";
import { PantryVerifyStep } from "@/components/kitchen/PantryVerifyStep";
import { PantryLabelScanSheet } from "@/components/kitchen/PantryLabelScanSheet";
import { isPantryVerified } from "@/lib/kitchen/pantry-label";
import { ChevronRight, Coffee, Store, UtensilsCrossed, Leaf, Camera, CheckCircle2, Pencil, Trash2 } from "lucide-react";

type Tab = "appliance" | "pantry" | "venue" | "template" | "spice";
type MachineSetupStep = "search" | "drink" | "tune" | "verify";

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
  const [setupStep, setSetupStep] = useState<MachineSetupStep>("search");
  const [selectedDrinkId, setSelectedDrinkId] = useState<string | null>(null);
  const [selectedDrinkLabel, setSelectedDrinkLabel] = useState("");
  const [pantryScanType, setPantryScanType] = useState<PantryItemType | null>(null);
  const [editingApplianceId, setEditingApplianceId] = useState<string | null>(null);

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

  const resetWizard = () => {
    setSelectedModel(null);
    setEditingApplianceId(null);
    setMachineQuery("");
    setSetupStep("search");
    setSelectedDrinkId(null);
    setSelectedDrinkLabel("");
    setChannelSeconds({});
    setChannelPantry({});
    setNickname("");
  };

  const startEdit = (app: ConfiguredAppliance) => {
    const m = findCatalogModel(app.catalogModelId);
    if (!m) return;
    setEditingApplianceId(app.id);
    setSelectedModel(m);
    setNickname(app.nickname);
    setChannelSeconds({ ...app.channelSeconds });
    setChannelPantry({ ...app.channelPantryIds });
    setSelectedDrinkId(app.usualDrinkId ?? null);
    setSelectedDrinkLabel(app.usualDrinkLabel ?? "");
    setSetupStep("tune");
  };

  const deleteAppliance = (id: string) => {
    if (!confirm("Remove this machine from Kitchen Memory?")) return;
    void saveKm({
      ...km,
      appliances: km.appliances.filter((a) => a.id !== id),
    });
    if (editingApplianceId === id) resetWizard();
  };

  const selectModel = (m: ApplianceCatalogModel) => {
    setEditingApplianceId(null);
    setSelectedModel(m);
    setNickname(m.fullName);
    setSetupStep(getDrinkPresets(m).length > 0 ? "drink" : "tune");
    setSelectedDrinkId(null);
    setSelectedDrinkLabel("");
    const secs: Record<string, number> = {};
    setChannelSeconds(secs);
    setChannelPantry({});
  };

  const selectDrink = (drinkId: string, drinkLabel: string) => {
    if (!selectedModel) return;
    const preset = getDrinkPresets(selectedModel).find((p) => p.id === drinkId);
    setSelectedDrinkId(drinkId);
    setSelectedDrinkLabel(drinkLabel);
    if (preset) {
      setChannelSeconds(applyDrinkPreset(selectedModel, preset));
    }
    setSetupStep("tune");
  };

  const skipDrinkSelection = () => {
    setSelectedDrinkId("custom");
    setSelectedDrinkLabel("Custom");
    setSetupStep("tune");
  };

  const saveAppliance = (linkedPantry: Record<string, string> = channelPantry) => {
    if (!selectedModel) return;
    const existing = editingApplianceId ? km.appliances.find((a) => a.id === editingApplianceId) : undefined;
    const app: ConfiguredAppliance = {
      id: existing?.id ?? newId("app"),
      catalogModelId: selectedModel.id,
      nickname,
      channelSeconds,
      channelPantryIds: linkedPantry,
      channelMaxSeconds: existing?.channelMaxSeconds ?? defaultChannelMaxSeconds(selectedModel),
      calibrationFactor: existing?.calibrationFactor ?? 1,
      includeEspresso: existing?.includeEspresso ?? true,
      showInMorning: existing?.showInMorning ?? true,
      vesselLabel: existing?.vesselLabel ?? "My mug",
      usualDrinkId: selectedDrinkId ?? undefined,
      usualDrinkLabel: selectedDrinkLabel || undefined,
    };
    void saveKm({
      ...km,
      setupComplete: true,
      appliances: existing
        ? km.appliances.map((a) => (a.id === existing.id ? app : a))
        : [...km.appliances, app],
    });
    resetWizard();
  };

  const addVerifiedPantry = (fields: Omit<PantryItem, "id">) => {
    const item: PantryItem = { ...fields, id: newId("pantry"), labelVerified: true };
    void saveKm({
      ...km,
      pantryItems: [...km.pantryItems.filter((p) => !(p.type === item.type && !p.labelVerified)), item],
    });
    setPantryScanType(null);
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
          Tell Caveman about your coffee machine — which drink you make, the seconds on your display, and photograph the
          actual milk, cream, and products you use. No guessing when you say what&apos;s in your fridge.
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
            if (editingApplianceId === a.id && selectedModel) return null;
            return (
              <Card key={a.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{a.nickname}</p>
                    <p className="text-sm text-neutral-500">
                      {m ? getManufacturerName(m.manufacturerId) : ""} {m?.name} · {describeApplianceShort(a)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(a)}
                      className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
                      aria-label="Edit machine"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteAppliance(a.id)}
                      className="rounded-full p-2 text-neutral-500 hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Delete machine"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
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
                      {getDrinkPresets(m).length > 0 && ` · ${getDrinkPresets(m).length} drink programs`}
                    </p>
                  </button>
                ))}
              </div>
            </Card>
          ) : setupStep === "drink" ? (
            <Card className="space-y-4">
              <p className="font-semibold">{selectedModel.fullName}</p>
              <p className="text-sm text-neutral-700">
                What drink do you usually make on this machine? We&apos;ll ask for the seconds <em>your</em> display shows — often longer than factory defaults.
              </p>
              <div className="flex flex-wrap gap-2">
                {getDrinkPresets(selectedModel).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectDrink(p.id, p.label)}
                    className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium hover:bg-neutral-200"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <Button variant="secondary" className="w-full" onClick={skipDrinkSelection}>
                Custom / other drink
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => { resetWizard(); }}>
                Back
              </Button>
            </Card>
          ) : setupStep === "verify" ? (
            <Card className="space-y-4">
              <p className="font-semibold">{selectedModel.fullName} · {selectedDrinkLabel || "Your drink"}</p>
              <PantryVerifyStep
                model={selectedModel}
                channelSeconds={channelSeconds}
                drinkPreset={getDrinkPresets(selectedModel).find((p) => p.id === selectedDrinkId)}
                kitchenMemory={km}
                onKitchenMemoryChange={(next) => void saveKm(next)}
                onComplete={(linked) => {
                  setChannelPantry(linked);
                  saveAppliance(linked);
                }}
                onBack={() => setSetupStep("tune")}
              />
            </Card>
          ) : (
            <Card className="space-y-4">
              <p className="font-semibold">
                {editingApplianceId ? "Edit" : "Set up"} {selectedModel.fullName}
              </p>
              {selectedDrinkLabel && (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Setting up: <strong>{selectedDrinkLabel}</strong> — slide each bar to match what your machine shows.
                </p>
              )}
              {selectedModel.notes && <p className="text-sm text-neutral-600">{selectedModel.notes}</p>}
              <Input placeholder="Nickname (e.g. Kitchen Jura)" value={nickname} onChange={(e) => setNickname(e.target.value)} />

              <ApplianceChannelSliders
                model={selectedModel}
                channels={selectedModel.channels}
                seconds={channelSeconds}
                onChange={setChannelSeconds}
                mode="setup"
                drinkLabel={selectedDrinkLabel || "your drink"}
              />

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setSetupStep(getDrinkPresets(selectedModel).length > 0 ? "drink" : "search")}
                >
                  Back
                </Button>
                <Button className="flex-1" onClick={() => setSetupStep("verify")}>
                  Next — photograph products
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === "pantry" && (
        <div className="space-y-4">
          <Card>
            <p className="mb-3 text-sm text-neutral-600">
              Every product needs a label photo — we read your carton, not a generic database. Tap to scan what&apos;s
              actually in your fridge.
            </p>
            <div className="flex flex-wrap gap-2">
              {(["whole_milk", "cream", "half_and_half", "oat_milk", "spice", "sauce"] as PantryItemType[]).map((t) => (
                <Button key={t} variant="secondary" size="sm" onClick={() => setPantryScanType(t)}>
                  <Camera size={14} />
                  Scan {PANTRY_TYPE_LABELS[t]}
                </Button>
              ))}
            </div>
          </Card>
          {km.pantryItems.length === 0 && (
            <Card>
              <p className="text-sm text-neutral-500">No products yet — scan your milk and cream labels to get started.</p>
            </Card>
          )}
          {km.pantryItems.map((p) => (
            <Card key={p.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-neutral-500">
                    {p.perTsp ? "per tsp" : "per 100ml"} · {p.calories} cal
                    {p.brand ? ` · ${p.brand}` : ""}
                  </p>
                </div>
                {isPantryVerified(p) ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-700">
                    <CheckCircle2 size={14} />
                    Label
                  </span>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => setPantryScanType(p.type)}>
                    Scan label
                  </Button>
                )}
              </div>
            </Card>
          ))}
          {pantryScanType && (
            <PantryLabelScanSheet
              type={pantryScanType}
              onVerified={addVerifiedPantry}
              onClose={() => setPantryScanType(null)}
            />
          )}
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
