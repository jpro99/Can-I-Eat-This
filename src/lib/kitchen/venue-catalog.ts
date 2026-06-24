// src/lib/kitchen/venue-catalog.ts

import type { VenueOrderTemplate } from "@/types";

export interface VenueCatalogItem {
  id: string;
  venueId: string;
  venueName: string;
  itemName: string;
  size?: string;
  customizations?: string;
  nutrition: VenueOrderTemplate["nutrition"];
}

export const VENUE_CATALOG: VenueCatalogItem[] = [
  // Starbucks
  { id: "sbux-pike-black", venueId: "starbucks", venueName: "Starbucks", itemName: "Pike Place Roast", size: "Grande (16 oz)", nutrition: { calories: 5, protein: 0.6, carbs: 0, fats: 0, sodium: 10 } },
  { id: "sbux-caffe-latte", venueId: "starbucks", venueName: "Starbucks", itemName: "Caffè Latte", size: "Grande", customizations: "2% milk", nutrition: { calories: 190, protein: 13, carbs: 18, fats: 7, sugar: 17, sodium: 170 } },
  { id: "sbux-oat-latte", venueId: "starbucks", venueName: "Starbucks", itemName: "Caffè Latte", size: "Grande", customizations: "Oat milk", nutrition: { calories: 210, protein: 4, carbs: 28, fats: 6, sugar: 19, sodium: 190 } },
  { id: "sbux-cold-brew", venueId: "starbucks", venueName: "Starbucks", itemName: "Cold Brew", size: "Grande", nutrition: { calories: 5, protein: 0, carbs: 0, fats: 0, sodium: 15 } },
  { id: "sbux-americano", venueId: "starbucks", venueName: "Starbucks", itemName: "Caffè Americano", size: "Grande", nutrition: { calories: 15, protein: 1, carbs: 2, fats: 0, sodium: 10 } },
  { id: "sbux-cappuccino", venueId: "starbucks", venueName: "Starbucks", itemName: "Cappuccino", size: "Grande", nutrition: { calories: 140, protein: 10, carbs: 12, fats: 5, sugar: 11, sodium: 120 } },
  // McDonald's
  { id: "mcd-black-coffee", venueId: "mcdonalds", venueName: "McDonald's", itemName: "Premium Roast Coffee", size: "Medium", nutrition: { calories: 5, protein: 0.6, carbs: 1, fats: 0, sodium: 10 } },
  { id: "mcd-latte", venueId: "mcdonalds", venueName: "McDonald's", itemName: "Latte", size: "Medium", nutrition: { calories: 190, protein: 9, carbs: 20, fats: 7, sugar: 18, sodium: 150 } },
  { id: "mcd-cappuccino", venueId: "mcdonalds", venueName: "McDonald's", itemName: "Cappuccino", size: "Medium", nutrition: { calories: 120, protein: 6, carbs: 12, fats: 5, sugar: 10, sodium: 110 } },
  { id: "mcd-iced-coffee", venueId: "mcdonalds", venueName: "McDonald's", itemName: "Iced Coffee", size: "Medium", customizations: "Light cream & sugar", nutrition: { calories: 180, protein: 2, carbs: 28, fats: 6, sugar: 25, sodium: 50 } },
  // Dunkin'
  { id: "dunkin-hot-coffee", venueId: "dunkin", venueName: "Dunkin'", itemName: "Hot Coffee", size: "Medium", nutrition: { calories: 5, protein: 0, carbs: 0, fats: 0, sodium: 10 } },
  { id: "dunkin-latte", venueId: "dunkin", venueName: "Dunkin'", itemName: "Latte", size: "Medium", nutrition: { calories: 170, protein: 10, carbs: 18, fats: 6, sugar: 16, sodium: 130 } },
  { id: "dunkin-cold-brew", venueId: "dunkin", venueName: "Dunkin'", itemName: "Cold Brew", size: "Medium", nutrition: { calories: 5, protein: 0, carbs: 1, fats: 0, sodium: 15 } },
  // Chipotle (meal templates as venue)
  { id: "chipotle-chicken-bowl", venueId: "chipotle", venueName: "Chipotle", itemName: "Chicken bowl", customizations: "Rice, beans, fajita veggies, salsa", nutrition: { calories: 640, protein: 42, carbs: 68, fats: 20, sodium: 1450, fiber: 12 } },
  // Panera
  { id: "panera-ten-veg", venueId: "panera", venueName: "Panera", itemName: "Ten Vegetable Soup", size: "Bowl", nutrition: { calories: 180, protein: 5, carbs: 28, fats: 4, sodium: 980, fiber: 6 } },
];

export function searchVenueCatalog(query: string): VenueCatalogItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return VENUE_CATALOG;
  return VENUE_CATALOG.filter(
    (v) =>
      v.venueName.toLowerCase().includes(q) ||
      v.itemName.toLowerCase().includes(q) ||
      v.venueId.includes(q) ||
      (v.customizations?.toLowerCase().includes(q) ?? false)
  );
}

export function findVenueCatalogItem(id: string): VenueCatalogItem | undefined {
  return VENUE_CATALOG.find((v) => v.id === id);
}

export const VENUE_BRANDS = [
  { id: "starbucks", name: "Starbucks" },
  { id: "mcdonalds", name: "McDonald's" },
  { id: "dunkin", name: "Dunkin'" },
  { id: "chipotle", name: "Chipotle" },
  { id: "panera", name: "Panera Bread" },
];
