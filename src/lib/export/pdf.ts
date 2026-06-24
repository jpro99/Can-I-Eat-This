// src/lib/export/pdf.ts

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { HistorySummary, MealLogItem, UserProfileData } from "@/types";

export function generatePDFReport(
  profile: UserProfileData,
  summary: HistorySummary,
  meals: MealLogItem[],
  title: string
): Blob {
  const doc = new jsPDF();
  const margin = 20;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Caveman Nutrition Report", margin, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`${title}`, margin, y);
  y += 6;
  doc.text(`${summary.startDate} — ${summary.endDate}`, margin, y);
  y += 6;
  doc.text(`Prepared for: ${profile.name || "User"}`, margin, y);
  y += 12;

  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Summary", margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const summaryLines = [
    `Total calories: ${Math.round(summary.totalCalories)}`,
    `Average daily calories: ${Math.round(summary.avgCalories)}`,
    `Total protein: ${Math.round(summary.totalProtein)}g`,
    `Average daily protein: ${Math.round(summary.avgProtein)}g`,
    `Average sugar: ${Math.round(summary.avgSugar)}g`,
    `Average sodium: ${Math.round(summary.avgSodium)}mg`,
    `Average fiber: ${Math.round(summary.avgFiber)}g`,
    `Ingredient flags: ${summary.flagCount}`,
  ];
  for (const line of summaryLines) {
    doc.text(line, margin, y);
    y += 6;
  }
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [["Date", "Food", "Cal", "Protein", "Verdict", "Flags"]],
    body: meals.slice(0, 100).map((m) => [
      m.timestamp.slice(0, 10),
      m.foodName,
      Math.round(m.calories).toString(),
      `${Math.round(m.protein)}g`,
      m.decisionVerdict,
      m.ingredientFlags.length.toString(),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 30, 30] },
  });

  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    "This report is for personal nutrition tracking only and is not medical advice.",
    margin,
    finalY
  );

  return doc.output("blob");
}
