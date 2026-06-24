// src/app/api/kitchen/log/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getOrCreateProfile, prisma } from "@/lib/db";
import { mapProfile } from "@/lib/profile/mapper";
import { calculateApplianceDrink } from "@/lib/kitchen/appliance-calculator";
import { findCatalogModel, getDrinkPresets } from "@/lib/kitchen/appliance-catalog";
import { unverifiedPantryForAppliance } from "@/lib/kitchen/pantry-label";
import { detectMealType } from "@/lib/utils";
import type { ConfiguredAppliance } from "@/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const profile = mapProfile(await getOrCreateProfile());
  const km = profile.kitchenMemory;
  const { type, sourceId, channelSeconds, channelPantryIds, saveDefaults, mealType, usualDrinkId, usualDrinkLabel } = body as {
    type: "appliance" | "venue" | "template";
    sourceId: string;
    channelSeconds?: Record<string, number>;
    channelPantryIds?: Record<string, string>;
    saveDefaults?: boolean;
    mealType?: string;
    usualDrinkId?: string;
    usualDrinkLabel?: string;
  };

  if (type === "appliance") {
    const appliance = km.appliances.find((a) => a.id === sourceId);
    if (!appliance) return NextResponse.json({ error: "Appliance not found" }, { status: 404 });

    const effective: ConfiguredAppliance = {
      ...appliance,
      channelSeconds: channelSeconds ?? appliance.channelSeconds,
      channelPantryIds: channelPantryIds ?? appliance.channelPantryIds,
      usualDrinkLabel: usualDrinkLabel ?? appliance.usualDrinkLabel,
      usualDrinkId: usualDrinkId ?? appliance.usualDrinkId,
    };

    const catalogModel = findCatalogModel(appliance.catalogModelId);
    const drinkPreset =
      catalogModel && appliance.usualDrinkId
        ? getDrinkPresets(catalogModel).find((p) => p.id === appliance.usualDrinkId)
        : undefined;
    const missingLabels = unverifiedPantryForAppliance(
      km,
      catalogModel,
      effective.channelSeconds,
      effective.channelPantryIds,
      drinkPreset
    );
    if (missingLabels.length > 0) {
      return NextResponse.json(
        {
          error: "Photograph your product labels first — we don't guess nutrition for items you say you use.",
          missingLabels: missingLabels.map((m) => m.type),
        },
        { status: 422 }
      );
    }

    if (saveDefaults && (channelSeconds || channelPantryIds || usualDrinkLabel || usualDrinkId)) {
      const updated = {
        ...km,
        appliances: km.appliances.map((a) =>
          a.id === sourceId
            ? {
                ...a,
                channelSeconds: channelSeconds
                  ? { ...a.channelSeconds, ...channelSeconds }
                  : a.channelSeconds,
                channelPantryIds: channelPantryIds
                  ? { ...a.channelPantryIds, ...channelPantryIds }
                  : a.channelPantryIds,
                usualDrinkLabel: usualDrinkLabel ?? a.usualDrinkLabel,
                usualDrinkId: usualDrinkId ?? a.usualDrinkId,
              }
            : a
        ),
      };
      await prisma.userProfile.update({
        where: { id: profile.id },
        data: { kitchenMemory: JSON.stringify(updated) },
      });
    }

    const { nutrition, servingDescription, ingredients } = calculateApplianceDrink(effective, km);
    const logName = effective.nickname;

    const log = await prisma.mealLog.create({
      data: {
        profileId: profile.id,
        mealType: mealType ?? "breakfast",
        sourceType: "appliance",
        foodName: logName,
        servings: 1,
        servingSize: servingDescription,
        confidence: 0.95,
        isEstimated: false,
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fats: nutrition.fats,
        sugar: nutrition.sugar ?? 0,
        sodium: nutrition.sodium ?? 0,
        fiber: nutrition.fiber ?? 0,
        ingredients,
        ingredientFlags: "[]",
        decisionScore: 88,
        decisionVerdict: "eat",
        decisionReasons: JSON.stringify(["Logged from your coffee machine profile"]),
        forYouSummary: `Logged ${servingDescription}.`,
        rawData: JSON.stringify({ applianceId: sourceId, channelSeconds: effective.channelSeconds }),
      },
    });
    return NextResponse.json({ log, nutrition, servingDescription });
  }

  if (type === "venue") {
    const order = km.venueOrders.find((v) => v.id === sourceId);
    if (!order) return NextResponse.json({ error: "Venue order not found" }, { status: 404 });
    const n = order.nutrition;
    const log = await prisma.mealLog.create({
      data: {
        profileId: profile.id,
        mealType: mealType ?? detectMealType(),
        mealOrigin: "restaurant",
        restaurantName: order.venueName,
        sourceType: "venue",
        foodName: `${order.venueName} ${order.itemName}`,
        servings: 1,
        servingSize: [order.size, order.customizations].filter(Boolean).join(" · "),
        confidence: 0.9,
        isEstimated: false,
        calories: n.calories,
        protein: n.protein,
        carbs: n.carbs,
        fats: n.fats,
        sugar: n.sugar ?? 0,
        sodium: n.sodium ?? 0,
        fiber: n.fiber ?? 0,
        ingredients: order.itemName,
        ingredientFlags: "[]",
        decisionScore: 75,
        decisionVerdict: "caution",
        decisionReasons: JSON.stringify([`${order.venueName} — chain nutrition estimate`]),
        forYouSummary: `Logged your usual ${order.itemName} from ${order.venueName}.`,
      },
    });
    return NextResponse.json({ log });
  }

  if (type === "template") {
    const tpl = km.mealTemplates.find((t) => t.id === sourceId);
    if (!tpl) return NextResponse.json({ error: "Template not found" }, { status: 404 });
    let extraCal = 0;
    let extraSodium = 0;
    if (tpl.spiceSetId) {
      const set = km.spiceSets.find((s) => s.id === tpl.spiceSetId);
      if (set) {
        for (const pid of set.pantryItemIds) {
          const p = km.pantryItems.find((x) => x.id === pid);
          if (p?.perTsp) {
            extraCal += Math.round(p.calories * set.tspPerMeal);
            extraSodium += Math.round((p.sodium ?? 0) * set.tspPerMeal);
          }
        }
      }
    }
    const nutrition = {
      ...tpl.nutrition,
      calories: tpl.nutrition.calories + extraCal,
      sodium: (tpl.nutrition.sodium ?? 0) + extraSodium,
    };
    const log = await prisma.mealLog.create({
      data: {
        profileId: profile.id,
        mealType: mealType ?? tpl.mealType,
        mealOrigin: "homemade",
        sourceType: "template",
        foodName: tpl.name,
        servings: 1,
        servingSize: "Usual portion",
        confidence: 0.92,
        isEstimated: false,
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fats: nutrition.fats,
        sugar: nutrition.sugar ?? 0,
        sodium: nutrition.sodium ?? 0,
        fiber: nutrition.fiber ?? 0,
        ingredients: tpl.ingredients ?? tpl.name,
        ingredientFlags: "[]",
        decisionScore: 85,
        decisionVerdict: "eat",
        decisionReasons: JSON.stringify(["Logged from your meal template"]),
        forYouSummary: `Same as your usual ${tpl.name}.`,
      },
    });
    return NextResponse.json({ log });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
