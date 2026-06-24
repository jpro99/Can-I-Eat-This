// src/components/food/DecisionCard.tsx

"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { DecisionResult, FoodAnalysis, RestaurantInfo } from "@/types";
import { verdictBg, verdictColor, verdictLabel, cn } from "@/lib/utils";
import { originLabel as getOriginLabel } from "@/lib/nutrition/portions";
import { AlertTriangle, CheckCircle2, XCircle, User } from "lucide-react";

interface DecisionCardProps {
  analysis: FoodAnalysis;
  decision: DecisionResult;
  restaurant?: RestaurantInfo | null;
}

export function DecisionCard({ analysis, decision, restaurant }: DecisionCardProps) {
  const Icon =
    decision.verdict === "eat" ? CheckCircle2 : decision.verdict === "avoid" ? XCircle : AlertTriangle;

  return (
    <div className="space-y-4">
      <Card className={cn("overflow-hidden border-2", verdictBg(decision.verdict))}>
        <div className="flex items-start gap-3 rounded-2xl bg-neutral-900 p-4 text-white dark:bg-neutral-800">
          <User className="mt-1 h-5 w-5 shrink-0" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-300">For you</p>
            <p className="mt-1 text-sm leading-relaxed">{decision.forYouSummary}</p>
          </div>
        </div>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-neutral-500">Caveman Score</p>
            <p className={cn("text-5xl font-bold tracking-tight", verdictColor(decision.verdict))}>
              {decision.score}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={decision.verdict}>{verdictLabel(decision.verdict)}</Badge>
            <Icon className={cn("h-8 w-8", verdictColor(decision.verdict))} />
          </div>
        </div>

        <h2 className="mt-4 text-xl font-semibold">{analysis.foodName}</h2>
        <div className="mt-1 flex flex-wrap gap-2">
          {analysis.brand && <p className="text-sm text-neutral-500">{analysis.brand}</p>}
          {analysis.mealContext?.mealOrigin && (
            <Badge>{getOriginLabel(analysis.mealContext.mealOrigin)}</Badge>
          )}
          {analysis.mealContext?.restaurantName && (
            <Badge variant="caution">{analysis.mealContext.restaurantName}</Badge>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {decision.reasons.map((reason, i) => (
            <p key={i} className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              • {reason}
            </p>
          ))}
        </div>

        {decision.suggestions.length > 0 && (
          <div className="mt-4 rounded-2xl bg-white/70 p-3 dark:bg-neutral-800/50">
            <p className="text-xs font-medium uppercase text-neutral-500">Suggestions</p>
            {decision.suggestions.map((s, i) => (
              <p key={i} className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">→ {s}</p>
            ))}
          </div>
        )}

        <div className="mt-5 grid grid-cols-4 gap-2 text-center">
          {[
            { label: "Cal", value: Math.round(analysis.nutrition.calories * (analysis.servings ?? 1)) },
            { label: "Protein", value: `${Math.round(analysis.nutrition.protein * (analysis.servings ?? 1))}g` },
            { label: "Carbs", value: `${Math.round(analysis.nutrition.carbs * (analysis.servings ?? 1))}g` },
            { label: "Fat", value: `${Math.round(analysis.nutrition.fats * (analysis.servings ?? 1))}g` },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-white/70 p-2 dark:bg-neutral-800/50">
              <p className="text-xs text-neutral-500">{item.label}</p>
              <p className="font-semibold">{item.value}</p>
            </div>
          ))}
        </div>

        {analysis.isEstimated && (
          <p className="mt-4 text-xs text-neutral-500">
            Estimated · Confidence {Math.round(analysis.confidence * 100)}% — confirm portion on next screen
          </p>
        )}

        {analysis.ingredientFlags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {analysis.ingredientFlags.slice(0, 4).map((flag) => (
              <Badge key={flag.name} variant="caution">
                {flag.name}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {restaurant && (
        <Card className="border-amber-200 bg-amber-50">
          <p className="font-medium text-amber-900">{restaurant.name} intel</p>
          <p className="mt-1 text-sm text-amber-800">{restaurant.notes}</p>
          {restaurant.tips.slice(0, 2).map((tip) => (
            <p key={tip} className="mt-2 text-sm text-amber-800">• {tip}</p>
          ))}
        </Card>
      )}
    </div>
  );
}
