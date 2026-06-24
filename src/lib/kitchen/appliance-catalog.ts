// src/lib/kitchen/appliance-catalog.ts — manufacturer lookup & dispense profiles

import type {
  ApplianceCatalogModel,
  ApplianceManufacturer,
  DispenseChannelSpec,
  MachineDrinkPreset,
} from "@/types";
import { COFFEE_CHANNEL_ID } from "@/lib/kitchen/appliance-sliders";

const ESPRESSO_BASE = { calories: 5, protein: 0.3, carbs: 0, fats: 0, ml: 30 };

const JURA_SUPER_AUTO_DRINKS: MachineDrinkPreset[] = [
  {
    id: "flat_white",
    label: "Flat White",
    channelSeconds: { coffee: 6, milk: 40, cream: 0 },
    requiredPantryTypes: ["whole_milk", "cream"],
  },
  {
    id: "cappuccino",
    label: "Cappuccino",
    channelSeconds: { coffee: 6, milk: 12, cream: 8 },
  },
  {
    id: "latte",
    label: "Caffè Latte",
    channelSeconds: { coffee: 6, milk: 28, cream: 0 },
  },
  {
    id: "latte_macchiato",
    label: "Latte Macchiato",
    channelSeconds: { coffee: 6, milk: 8, cream: 6 },
  },
  {
    id: "espresso",
    label: "Espresso",
    channelSeconds: { coffee: 6, milk: 0, cream: 0 },
  },
  {
    id: "ristretto",
    label: "Ristretto",
    channelSeconds: { coffee: 4, milk: 0, cream: 0 },
  },
  {
    id: "americano",
    label: "Americano",
    channelSeconds: { coffee: 10, milk: 0, cream: 0 },
  },
];

function ch(
  id: string,
  label: string,
  mlPerSecond: number,
  maxSeconds: number,
  liquidType: DispenseChannelSpec["defaultLiquidType"] = "whole_milk",
  setupHint?: string
): DispenseChannelSpec {
  return { id, label, mlPerSecond, maxSeconds, defaultLiquidType: liquidType, setupHint };
}

function coffeeChannel(maxSeconds = 15): DispenseChannelSpec {
  return ch(
    COFFEE_CHANNEL_ID,
    "Coffee (espresso)",
    5,
    maxSeconds,
    "other",
    "Seconds of espresso on your machine display"
  );
}

function juraMilkChannels(): DispenseChannelSpec[] {
  return [
    ch(
      "milk",
      "Milk",
      11,
      60,
      "whole_milk",
      "Total milk pour time — on Flat White this is often 35–50 sec"
    ),
    ch(
      "cream",
      "Cream / light foam",
      10,
      60,
      "cream",
      "Light/cream portion if your drink uses a separate foam cycle"
    ),
  ];
}

function superAutoChannels(
  milkMlPerSec = 11,
  creamMlPerSec = 10,
  withCream = true
): DispenseChannelSpec[] {
  const channels: DispenseChannelSpec[] = [
    coffeeChannel(),
    ch("milk", "Milk", milkMlPerSec, 60, "whole_milk", "Milk pour time on your machine display"),
  ];
  if (withCream) {
    channels.push(
      ch(
        "cream",
        "Cream / light foam",
        creamMlPerSec,
        60,
        "cream",
        "Light/cream or foam cycle if separate from milk"
      )
    );
  }
  return channels;
}

function model(
  id: string,
  manufacturerId: string,
  name: string,
  category: ApplianceCatalogModel["category"],
  channels: DispenseChannelSpec[],
  notes?: string,
  drinkPresets?: MachineDrinkPreset[]
): ApplianceCatalogModel {
  return {
    id,
    manufacturerId,
    name,
    fullName: name,
    category,
    channels,
    espressoBaseMl: ESPRESSO_BASE.ml,
    notes,
    drinkPresets,
  };
}

export const APPLIANCE_CATALOG: ApplianceCatalogModel[] = [
  model(
    "jura-s8",
    "jura",
    "Jura S8",
    "super_automatic",
    [coffeeChannel(), ...juraMilkChannels()],
    "G3 milk system — Flat White, Cappuccino, Latte on the touchscreen. Enter the seconds YOUR display shows.",
    JURA_SUPER_AUTO_DRINKS
  ),
  model(
    "jura-e8",
    "jura",
    "Jura E8",
    "super_automatic",
    superAutoChannels(11, 10, true),
    "Enter seconds from your drink program — often longer than factory defaults.",
    JURA_SUPER_AUTO_DRINKS
  ),
  model(
    "jura-e6",
    "jura",
    "Jura E6",
    "super_automatic",
    [coffeeChannel(), ch("milk", "Milk", 10, 60, "whole_milk")],
    undefined,
    JURA_SUPER_AUTO_DRINKS.filter((d) => (d.channelSeconds.cream ?? 0) === 0 || d.id !== "latte_macchiato")
  ),
  model(
    "jura-z10",
    "jura",
    "Jura Z10",
    "super_automatic",
    superAutoChannels(12, 11, true),
    undefined,
    JURA_SUPER_AUTO_DRINKS
  ),
  model(
    "jura-j8",
    "jura",
    "Jura J8",
    "super_automatic",
    superAutoChannels(11, 10, true),
    undefined,
    JURA_SUPER_AUTO_DRINKS
  ),
  model(
    "jura-ena8",
    "jura",
    "Jura ENA 8",
    "super_automatic",
    [coffeeChannel(), ch("milk", "Milk", 9, 60, "whole_milk")],
    undefined,
    JURA_SUPER_AUTO_DRINKS.filter((d) => !d.channelSeconds.cream)
  ),
  model(
    "jura-d6",
    "jura",
    "Jura D6",
    "super_automatic",
    [coffeeChannel(), ch("milk", "Milk", 9, 60, "whole_milk")],
    undefined,
    JURA_SUPER_AUTO_DRINKS.filter((d) => !d.channelSeconds.cream)
  ),
  model("breville-barista-express", "breville", "Barista Express", "semi_automatic", [
    ch("milk", "Steamed milk (manual)", 8, 30, "whole_milk"),
  ]),
  model("breville-barista-pro", "breville", "Barista Pro", "semi_automatic", [
    ch("milk", "Steamed milk", 8, 30, "whole_milk"),
  ]),
  model(
    "breville-oracle",
    "breville",
    "Oracle Touch",
    "super_automatic",
    superAutoChannels(11, 10, true),
    undefined,
    JURA_SUPER_AUTO_DRINKS
  ),
  model("breville-bambino", "breville", "Bambino Plus", "semi_automatic", [
    ch("milk", "Auto-froth milk", 9, 30, "whole_milk"),
  ]),
  model("delonghi-magnifica", "delonghi", "Magnifica Evo", "super_automatic", [
    coffeeChannel(),
    ch("milk", "Milk", 10, 60, "whole_milk"),
  ]),
  model(
    "delonghi-dinamica",
    "delonghi",
    "Dinamica Plus",
    "super_automatic",
    superAutoChannels(11, 10, true),
    undefined,
    JURA_SUPER_AUTO_DRINKS
  ),
  model("delonghi-truebrew", "delonghi", "TrueBrew", "drip", []),
  model("nespresso-vertuo", "nespresso", "Vertuo Plus", "pod", []),
  model("nespresso-lattissima", "nespresso", "Lattissima One", "pod", [
    ch("milk", "Integrated milk", 9, 30, "whole_milk"),
  ]),
  model("nespresso-creatista", "nespresso", "Creatista Plus", "semi_automatic", [
    ch("milk", "Steamed milk", 8, 30, "whole_milk"),
  ]),
  model("keurig-kcafe", "keurig", "K-Café", "pod", [
    ch("milk", "Froth / milk", 7, 30, "whole_milk"),
  ]),
  model("keurig-kelite", "keurig", "K-Elite", "pod", []),
  model("keurig-ksupreme", "keurig", "K-Supreme Plus", "pod", []),
  model("philips-4300", "philips", "Philips 4300 LatteGo", "super_automatic", [
    coffeeChannel(),
    ch("milk", "LatteGo milk", 11, 60, "whole_milk"),
  ]),
  model(
    "philips-5400",
    "philips",
    "Philips 5400",
    "super_automatic",
    superAutoChannels(11, 10, true),
    undefined,
    JURA_SUPER_AUTO_DRINKS
  ),
  model(
    "saeco-xelsis",
    "philips",
    "Saeco Xelsis",
    "super_automatic",
    superAutoChannels(11, 10, true),
    undefined,
    JURA_SUPER_AUTO_DRINKS
  ),
  model(
    "miele-cm6360",
    "miele",
    "Miele CM 6360",
    "super_automatic",
    superAutoChannels(10, 9, true),
    undefined,
    JURA_SUPER_AUTO_DRINKS
  ),
  model("miele-cm5310", "miele", "Miele CM 5310", "super_automatic", [
    coffeeChannel(),
    ch("milk", "Milk", 10, 60, "whole_milk"),
  ]),
  model("gaggia-magenta", "gaggia", "Gaggia Magenta Prestige", "super_automatic", [
    coffeeChannel(),
    ch("milk", "Milk carafe", 10, 60, "whole_milk"),
  ]),
  model("gaggia-brera", "gaggia", "Gaggia Brera", "super_automatic", [
    coffeeChannel(),
    ch("milk", "Pannarello steam", 8, 30, "whole_milk"),
  ]),
  model("smeg-bcc13", "smeg", "Smeg BCC13", "drip", []),
  model("hamilton-flexbrew", "hamilton_beach", "FlexBrew Trio", "drip", []),
  model("cuisinart-ss15", "cuisinart", "Cuisinart SS-15", "pod", []),
  model("mr-coffee-espresso", "mr_coffee", "Mr. Coffee Espresso", "semi_automatic", [
    ch("milk", "Steam wand", 7, 30, "whole_milk"),
  ]),
  model(
    "generic-super-auto",
    "generic",
    "Other super-automatic",
    "super_automatic",
    superAutoChannels(10, 9, true),
    "Pick your usual drink, then enter seconds from your machine display.",
    JURA_SUPER_AUTO_DRINKS
  ),
  model("generic-semi-auto", "generic", "Other semi-automatic / steam wand", "semi_automatic", [
    ch("milk", "Steamed milk", 8, 30, "whole_milk"),
  ]),
  model("generic-pod", "generic", "Other pod / K-Cup machine", "pod", []),
  model("generic-drip", "generic", "Other drip coffee maker", "drip", []),
];

export const APPLIANCE_MANUFACTURERS: ApplianceManufacturer[] = [
  { id: "jura", name: "Jura" },
  { id: "breville", name: "Breville" },
  { id: "delonghi", name: "De'Longhi" },
  { id: "nespresso", name: "Nespresso" },
  { id: "keurig", name: "Keurig" },
  { id: "philips", name: "Philips / Saeco" },
  { id: "miele", name: "Miele" },
  { id: "gaggia", name: "Gaggia" },
  { id: "smeg", name: "Smeg" },
  { id: "hamilton_beach", name: "Hamilton Beach" },
  { id: "cuisinart", name: "Cuisinart" },
  { id: "mr_coffee", name: "Mr. Coffee" },
  { id: "generic", name: "Other / Generic" },
];

export function findCatalogModel(id: string): ApplianceCatalogModel | undefined {
  return APPLIANCE_CATALOG.find((m) => m.id === id);
}

export function searchApplianceCatalog(query: string): ApplianceCatalogModel[] {
  const q = query.trim().toLowerCase();
  if (!q) return APPLIANCE_CATALOG;
  return APPLIANCE_CATALOG.filter((m) => {
    const mfg = APPLIANCE_MANUFACTURERS.find((x) => x.id === m.manufacturerId)?.name.toLowerCase() ?? "";
    return (
      m.name.toLowerCase().includes(q) ||
      m.fullName.toLowerCase().includes(q) ||
      m.manufacturerId.includes(q) ||
      mfg.includes(q)
    );
  });
}

export function getManufacturerName(id: string): string {
  return APPLIANCE_MANUFACTURERS.find((m) => m.id === id)?.name ?? id;
}

export function getDrinkPresets(model: ApplianceCatalogModel): MachineDrinkPreset[] {
  return model.drinkPresets ?? [];
}

export function applyDrinkPreset(
  model: ApplianceCatalogModel,
  preset: MachineDrinkPreset
): Record<string, number> {
  const secs: Record<string, number> = {};
  for (const ch of model.channels) {
    secs[ch.id] = preset.channelSeconds[ch.id] ?? 0;
  }
  return secs;
}
