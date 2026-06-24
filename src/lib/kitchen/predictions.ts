// src/lib/kitchen/predictions.ts

import { describeApplianceShort } from "@/lib/kitchen/appliance-calculator";
import { findCatalogModel, getManufacturerName } from "@/lib/kitchen/appliance-catalog";
import type { DailyRoutine, KitchenMemory, KitchenPrediction, MealLogItem } from "@/types";

export function generateKitchenPredictions(
  km: KitchenMemory,
  routines: DailyRoutine[],
  todaysMeals: MealLogItem[],
  hour = new Date().getHours()
): KitchenPrediction[] {
  const predictions: KitchenPrediction[] = [];
  const loggedNames = new Set(todaysMeals.map((m) => m.foodName.toLowerCase()));

  const wasLogged = (label: string) =>
    [...loggedNames].some((n) => n.includes(label.toLowerCase()) || label.toLowerCase().includes(n));

  for (const app of km.appliances) {
    if (hour >= 12 && app.showInMorning && hour < 17) continue;
    if (hour >= 17 && app.showInMorning) continue;
    const model = findCatalogModel(app.catalogModelId);
    const mfg = model ? getManufacturerName(model.manufacturerId) : "";
    const label = app.nickname || model?.fullName || "Coffee";
    const desc = describeApplianceShort(app);
    const already = wasLogged(label);
    predictions.push({
      id: `pred-appliance-${app.id}`,
      type: "appliance",
      label,
      emoji: "☕",
      description: `${mfg} ${model?.name ?? ""} · ${desc}`.trim(),
      confidence: km.setupComplete ? 0.92 : 0.75,
      sourceId: app.id,
      alreadyLoggedToday: already,
    });
  }

  for (const vo of km.venueOrders) {
    if (vo.showInMorning && hour >= 14) continue;
    const label = `${vo.venueName} ${vo.itemName}`;
    predictions.push({
      id: `pred-venue-${vo.id}`,
      type: "venue",
      label: vo.itemName,
      emoji: "🏪",
      description: `${vo.venueName}${vo.size ? ` · ${vo.size}` : ""}${vo.customizations ? ` · ${vo.customizations}` : ""}`,
      confidence: 0.88,
      sourceId: vo.id,
      alreadyLoggedToday: wasLogged(label) || wasLogged(vo.itemName),
    });
  }

  for (const tpl of km.mealTemplates) {
    if (tpl.showAtHours?.length && !tpl.showAtHours.some((h) => Math.abs(h - hour) <= 2)) continue;
    predictions.push({
      id: `pred-template-${tpl.id}`,
      type: "template",
      label: tpl.name,
      emoji: "🍽️",
      description: tpl.ingredients ?? "Your usual homemade meal",
      confidence: 0.9,
      sourceId: tpl.id,
      alreadyLoggedToday: wasLogged(tpl.name),
    });
  }

  if (hour < 12 || hour >= 17) {
    for (const r of routines.filter((x) => x.showInMorning)) {
      if (km.appliances.some((a) => a.showInMorning)) continue;
      predictions.push({
        id: `pred-routine-${r.id}`,
        type: "routine",
        label: r.name,
        emoji: r.emoji ?? "☕",
        description: r.servingDescription ?? "Daily routine",
        confidence: 0.85,
        sourceId: r.id,
        alreadyLoggedToday: wasLogged(r.name),
      });
    }
  }

  return predictions
    .filter((p) => !p.alreadyLoggedToday)
    .sort((a, b) => b.confidence - a.confidence);
}
