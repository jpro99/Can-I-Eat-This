// src/lib/kitchen/appliance-catalog.ts — manufacturer lookup & dispense profiles

import type { ApplianceCatalogModel, ApplianceManufacturer, DispenseChannelSpec } from "@/types";

const ESPresso_BASE = { calories: 5, protein: 0.3, carbs: 0, fats: 0, ml: 30 };

function ch(
  id: string,
  label: string,
  mlPerSecond: number,
  maxSeconds: number,
  liquidType: DispenseChannelSpec["defaultLiquidType"] = "whole_milk"
): DispenseChannelSpec {
  return { id, label, mlPerSecond, maxSeconds, defaultLiquidType: liquidType };
}

function model(
  id: string,
  manufacturerId: string,
  name: string,
  category: ApplianceCatalogModel["category"],
  channels: DispenseChannelSpec[],
  notes?: string
): ApplianceCatalogModel {
  return {
    id,
    manufacturerId,
    name,
    fullName: name,
    category,
    channels,
    espressoBaseMl: ESPresso_BASE.ml,
    notes,
  };
}

export const APPLIANCE_CATALOG: ApplianceCatalogModel[] = [
  // Jura
  model("jura-s8", "jura", "Jura S8", "super_automatic", [
    ch("milk", "Milk", 11, 15, "whole_milk"),
    ch("cream", "Cream / light", 10, 12, "cream"),
  ], "G3 milk system — typical ~10–12 ml/s"),
  model("jura-e8", "jura", "Jura E8", "super_automatic", [
    ch("milk", "Milk", 11, 15, "whole_milk"),
    ch("cream", "Light / extra foam milk", 10, 12, "half_and_half"),
  ]),
  model("jura-e6", "jura", "Jura E6", "super_automatic", [ch("milk", "Milk", 10, 14, "whole_milk")]),
  model("jura-z10", "jura", "Jura Z10", "super_automatic", [
    ch("milk", "Milk", 12, 18, "whole_milk"),
    ch("cream", "Cream", 11, 14, "cream"),
  ]),
  model("jura-j8", "jura", "Jura J8", "super_automatic", [
    ch("milk", "Milk", 11, 15, "whole_milk"),
    ch("cream", "Cream", 10, 12, "cream"),
  ]),
  model("jura-ena8", "jura", "Jura ENA 8", "super_automatic", [ch("milk", "Milk", 9, 12, "whole_milk")]),
  model("jura-d6", "jura", "Jura D6", "super_automatic", [ch("milk", "Milk", 9, 12, "whole_milk")]),
  // Breville
  model("breville-barista-express", "breville", "Barista Express", "semi_automatic", [
    ch("milk", "Steamed milk (manual)", 8, 20, "whole_milk"),
  ]),
  model("breville-barista-pro", "breville", "Barista Pro", "semi_automatic", [
    ch("milk", "Steamed milk", 8, 20, "whole_milk"),
  ]),
  model("breville-oracle", "breville", "Oracle Touch", "super_automatic", [
    ch("milk", "Milk", 11, 18, "whole_milk"),
    ch("foam", "Micro-foam", 10, 15, "whole_milk"),
  ]),
  model("breville-bambino", "breville", "Bambino Plus", "semi_automatic", [
    ch("milk", "Auto-froth milk", 9, 16, "whole_milk"),
  ]),
  // DeLonghi
  model("delonghi-magnifica", "delonghi", "Magnifica Evo", "super_automatic", [
    ch("milk", "Milk", 10, 14, "whole_milk"),
  ]),
  model("delonghi-dinamica", "delonghi", "Dinamica Plus", "super_automatic", [
    ch("milk", "Milk", 11, 15, "whole_milk"),
    ch("cream", "Cappuccino mix", 10, 12, "half_and_half"),
  ]),
  model("delonghi-truebrew", "delonghi", "TrueBrew", "drip", []),
  // Nespresso
  model("nespresso-vertuo", "nespresso", "Vertuo Plus", "pod", []),
  model("nespresso-lattissima", "nespresso", "Lattissima One", "pod", [
    ch("milk", "Integrated milk", 9, 14, "whole_milk"),
  ]),
  model("nespresso-creatista", "nespresso", "Creatista Plus", "semi_automatic", [
    ch("milk", "Steamed milk", 8, 18, "whole_milk"),
  ]),
  // Keurig
  model("keurig-kcafe", "keurig", "K-Café", "pod", [
    ch("milk", "Froth / milk", 7, 12, "whole_milk"),
  ]),
  model("keurig-kelite", "keurig", "K-Elite", "pod", []),
  model("keurig-ksupreme", "keurig", "K-Supreme Plus", "pod", []),
  // Philips / Saeco
  model("philips-4300", "philips", "Philips 4300 LatteGo", "super_automatic", [
    ch("milk", "LatteGo milk", 11, 16, "whole_milk"),
  ]),
  model("philips-5400", "philips", "Philips 5400", "super_automatic", [
    ch("milk", "Milk", 11, 16, "whole_milk"),
    ch("cream", "Light milk / foam", 10, 14, "half_and_half"),
  ]),
  model("saeco-xelsis", "philips", "Saeco Xelsis", "super_automatic", [
    ch("milk", "Milk", 11, 16, "whole_milk"),
    ch("cream", "Cream", 10, 13, "cream"),
  ]),
  // Miele
  model("miele-cm6360", "miele", "Miele CM 6360", "super_automatic", [
    ch("milk", "Milk", 10, 15, "whole_milk"),
    ch("cream", "Milk foam / light", 9, 13, "half_and_half"),
  ]),
  model("miele-cm5310", "miele", "Miele CM 5310", "super_automatic", [ch("milk", "Milk", 10, 14, "whole_milk")]),
  // Gaggia
  model("gaggia-magenta", "gaggia", "Gaggia Magenta Prestige", "super_automatic", [
    ch("milk", "Milk carafe", 10, 14, "whole_milk"),
  ]),
  model("gaggia-brera", "gaggia", "Gaggia Brera", "super_automatic", [ch("milk", "Pannarello steam", 8, 18, "whole_milk")]),
  // Smeg
  model("smeg-bcc13", "smeg", "Smeg BCC13", "drip", []),
  // Hamilton Beach / Cuisinart / Mr Coffee
  model("hamilton-flexbrew", "hamilton_beach", "FlexBrew Trio", "drip", []),
  model("cuisinart-ss15", "cuisinart", "Cuisinart SS-15", "pod", []),
  model("mr-coffee-espresso", "mr_coffee", "Mr. Coffee Espresso", "semi_automatic", [
    ch("milk", "Steam wand", 7, 20, "whole_milk"),
  ]),
  // Generic fallbacks
  model("generic-super-auto", "generic", "Other super-automatic", "super_automatic", [
    ch("milk", "Milk", 10, 15, "whole_milk"),
    ch("cream", "Cream / light", 9, 12, "cream"),
  ], "Use calibration to match your machine"),
  model("generic-semi-auto", "generic", "Other semi-automatic / steam wand", "semi_automatic", [
    ch("milk", "Steamed milk", 8, 20, "whole_milk"),
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
