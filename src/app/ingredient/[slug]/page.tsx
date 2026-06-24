// src/app/ingredient/[slug]/page.tsx

"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getIngredientDetail } from "@/lib/ingredients/flags";

export default function IngredientDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const detail = getIngredientDetail(slug);

  return (
    <AppShell hideNav>
      <Header title={detail.name} backHref="/today" />
      <Card className="space-y-4">
        <Badge variant={detail.severity === "high" ? "avoid" : "caution"}>
          {detail.category.replace(/_/g, " ")}
        </Badge>
        <div>
          <h3 className="font-medium">Why flagged</h3>
          <p className="mt-2 text-neutral-600 leading-relaxed">{detail.whyFlagged}</p>
        </div>
        <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800">
          <p className="text-sm text-neutral-500 leading-relaxed">{detail.guidance}</p>
        </div>
      </Card>
    </AppShell>
  );
}
