// src/app/reports/page.tsx

"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { HistorySummary, MealLogItem, UserProfileData } from "@/types";
import { generatePDFReport } from "@/lib/export/pdf";
import { generateCSV, downloadCSV, downloadBlob } from "@/lib/export/csv";

export default function ReportsPage() {
  const [range, setRange] = useState("7");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [meals, setMeals] = useState<MealLogItem[]>([]);

  const load = async () => {
    const url =
      start && end
        ? `/api/history?start=${start}&end=${end}`
        : `/api/history?range=${range}`;
    const [p, h, l] = await Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch(url).then((r) => r.json()),
      fetch(start && end ? `/api/logs?start=${start}&end=${end}T23:59:59` : `/api/logs`).then((r) => r.json()),
    ]);
    setProfile(p);
    setSummary(h);
    setMeals(l);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const title = range === "1" ? "Daily Report" : range === "7" ? "Weekly Report" : "Monthly Report";

  const exportPDF = () => {
    if (!profile || !summary) return;
    const blob = generatePDFReport(profile, summary, meals, title);
    downloadBlob(blob, `caveman-report-${summary.startDate}.pdf`);
  };

  const exportCSVFile = () => {
    if (!summary) return;
    downloadCSV(generateCSV(meals), `caveman-report-${summary.startDate}.csv`);
  };

  const printReport = () => window.print();

  return (
    <AppShell>
      <Header title="Reports" subtitle="Export and print" />

      <div className="no-print mb-4 flex gap-2">
        {["1", "7", "30"].map((r) => (
          <Button key={r} size="sm" variant={range === r ? "primary" : "secondary"} onClick={() => setRange(r)}>
            {r === "1" ? "Day" : r === "7" ? "Week" : "Month"}
          </Button>
        ))}
      </div>

      <Card className="no-print mb-4 space-y-3">
        <p className="text-sm font-medium text-neutral-500">Custom range</p>
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <Button variant="secondary" size="sm" onClick={load}>Apply range</Button>
      </Card>

      {summary && (
        <div id="report-preview">
          <Card className="mb-4">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="text-sm text-neutral-500">{summary.startDate} — {summary.endDate}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-neutral-500">Total calories</span><p className="font-semibold">{Math.round(summary.totalCalories)}</p></div>
              <div><span className="text-neutral-500">Avg daily cal</span><p className="font-semibold">{Math.round(summary.avgCalories)}</p></div>
              <div><span className="text-neutral-500">Total protein</span><p className="font-semibold">{Math.round(summary.totalProtein)}g</p></div>
              <div><span className="text-neutral-500">Ingredient flags</span><p className="font-semibold">{summary.flagCount}</p></div>
            </div>
          </Card>

          <Card className="mb-4">
            <h3 className="mb-2 font-semibold">Food log</h3>
            {meals.slice(0, 20).map((m) => (
              <div key={m.id} className="flex justify-between border-b border-neutral-100 py-2 text-sm last:border-0">
                <span>{m.foodName}</span>
                <span className="text-neutral-500">{Math.round(m.calories)} cal · {m.decisionVerdict}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      <div className="no-print mt-4 grid grid-cols-3 gap-2">
        <Button variant="secondary" onClick={exportPDF}>PDF</Button>
        <Button variant="secondary" onClick={exportCSVFile}>CSV</Button>
        <Button onClick={printReport}>Print</Button>
      </div>
    </AppShell>
  );
}
