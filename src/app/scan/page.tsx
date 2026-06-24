// src/app/scan/page.tsx

"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Barcode, Camera, UtensilsCrossed, Mic, Search, RotateCcw, Sparkles } from "lucide-react";

const modes = [
  { href: "/scan/barcode", icon: Barcode, title: "Barcode", desc: "Packaged food — fastest", primary: true },
  { href: "/scan/label", icon: Camera, title: "Label photo", desc: "Nutrition facts & ingredients" },
  { href: "/scan/plate", icon: UtensilsCrossed, title: "Plate photo", desc: "Restaurant or homemade meals" },
  { href: "/scan/voice", icon: Mic, title: "Voice", desc: "Say what you ate" },
  { href: "/scan/manual", icon: Search, title: "Search", desc: "Find by name" },
  { href: "/scan/recent", icon: RotateCcw, title: "Repeat meal", desc: "One-tap re-log" },
];

export default function ScanChooserPage() {
  return (
    <AppShell hideNav>
      <Header title="Add food" subtitle="Tell us where it's from first for smarter advice" backHref="/today" />

      <Link href="/scan/context">
        <Card className="mb-4 flex items-center gap-3 border-emerald-200 bg-emerald-50 transition-transform active:scale-[0.99]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
            <Sparkles size={22} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-emerald-900">Smart scan (recommended)</h3>
            <p className="text-sm text-emerald-800">Homemade, store, or restaurant — better portions & advice</p>
          </div>
        </Card>
      </Link>

      <p className="mb-3 text-sm font-medium text-neutral-500">Or pick a method</p>
      <div className="space-y-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <Link key={mode.href} href={mode.href}>
              <Card className="flex items-center gap-4 transition-transform active:scale-[0.99]">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${mode.primary ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700"}`}
                >
                  <Icon size={26} strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="font-semibold">{mode.title}</h3>
                  <p className="text-sm text-neutral-500">{mode.desc}</p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
