// src/lib/restaurants/knowledge.ts

import type { RestaurantInfo } from "@/types";

export const RESTAURANT_SEED: Omit<RestaurantInfo, "id">[] = [
  {
    name: "Chipotle",
    slug: "chipotle",
    sodiumLevel: "high",
    gmoRisk: "moderate",
    processingLevel: "moderate",
    notes: "Known for generous portions and seasoned rice. Sodium adds up fast with salsas and tortillas.",
    tips: [
      "Skip or go light on white rice — ask for half portions",
      "Sofritas and barbacoa tend to be higher in sodium",
      "Guacamole adds healthy fats but also increases calories",
    ],
  },
  {
    name: "McDonald's",
    slug: "mcdonalds",
    sodiumLevel: "very_high",
    gmoRisk: "moderate",
    processingLevel: "high",
    notes: "Highly processed menu. Most items use refined oils and added sodium. Limited clean options.",
    tips: [
      "Grilled chicken wrap is lower calorie than fried options",
      "Avoid supersizing — portions run large",
      "Salads can still be high sodium from dressing",
    ],
  },
  {
    name: "Olive Garden",
    slug: "olive-garden",
    sodiumLevel: "very_high",
    gmoRisk: "moderate",
    processingLevel: "high",
    notes: "Famous for breadsticks and pasta — very high sodium and refined carbs.",
    tips: [
      "One breadstick can exceed 400mg sodium",
      "Grilled protein + side salad is your safest bet",
      "Ask for dressing on the side",
    ],
  },
  {
    name: "Subway",
    slug: "subway",
    sodiumLevel: "high",
    gmoRisk: "moderate",
    processingLevel: "moderate",
    notes: "Deli meats are processed and sodium-heavy. Bread contains additives.",
    tips: [
      "Rotisserie chicken is lower sodium than cold cuts",
      "Double meat for protein if that's your gap today",
      "Skip chips and sugary drinks",
    ],
  },
  {
    name: "Panera Bread",
    slug: "panera",
    sodiumLevel: "high",
    gmoRisk: "moderate",
    processingLevel: "moderate",
    notes: "Health halo brand — many soups and sandwiches still exceed daily sodium targets in one meal.",
    tips: [
      "Pick half sandwich + salad combo",
      "Green Goddess or turkey bowls are cleaner picks",
      "Check sodium — some bowls exceed 1,500mg",
    ],
  },
  {
    name: "Starbucks",
    slug: "starbucks",
    sodiumLevel: "moderate",
    gmoRisk: "low",
    processingLevel: "moderate",
    notes: "Drinks often hide sugar. Food items vary — egg bites are decent protein.",
    tips: [
      "Egg white bites for protein without excess sugar",
      "Avoid flavored syrups in drinks",
      "Spinach feta wrap is a moderate option",
    ],
  },
  {
    name: "Cheesecake Factory",
    slug: "cheesecake-factory",
    sodiumLevel: "very_high",
    gmoRisk: "moderate",
    processingLevel: "high",
    notes: "Portions are enormous. Many dishes exceed full-day sodium and calorie targets.",
    tips: [
      "Split entrees — portions are 2–3 servings",
      "SkinnyLicious menu is lower calorie",
      "Expect high sodium regardless of choice",
    ],
  },
  {
    name: "In-N-Out Burger",
    slug: "in-n-out",
    sodiumLevel: "high",
    gmoRisk: "moderate",
    processingLevel: "high",
    notes: "Fresh-never-frozen patties but still fast food sodium and refined bun.",
    tips: [
      "Protein style (lettuce wrap) cuts refined carbs",
      "Mustard and ketchup add sugar — go easy",
      "Double protein if you need grams today",
    ],
  },
  {
    name: "Sweetgreen",
    slug: "sweetgreen",
    sodiumLevel: "moderate",
    gmoRisk: "low",
    processingLevel: "low",
    notes: "Generally cleaner ingredients. Dressings and toppings still add sodium.",
    tips: [
      "Build around double chicken for protein",
      "Light dressing — they pour heavy by default",
      "Good option when you're behind on vegetables",
    ],
  },
  {
    name: "Panda Express",
    slug: "panda-express",
    sodiumLevel: "very_high",
    gmoRisk: "high",
    processingLevel: "high",
    notes: "Very high sodium sauces. Many items use MSG and refined oils.",
    tips: [
      "Grilled teriyaki chicken is lower than orange chicken",
      "Steamed rice over fried rice",
      "Portions look small but sodium is concentrated",
    ],
  },
];

export function findRestaurant(query: string, dbRestaurants: RestaurantInfo[] = []): RestaurantInfo | null {
  const q = query.toLowerCase().trim();
  const all = [...dbRestaurants, ...RESTAURANT_SEED.map((r, i) => ({ ...r, id: `seed-${i}` }))];
  return (
    all.find((r) => r.name.toLowerCase() === q) ??
    all.find((r) => r.name.toLowerCase().includes(q) || q.includes(r.name.toLowerCase())) ??
    null
  );
}

export function searchRestaurants(query: string, dbRestaurants: RestaurantInfo[] = []): RestaurantInfo[] {
  if (!query.trim()) {
    return [...RESTAURANT_SEED.map((r, i) => ({ ...r, id: `seed-${i}` })), ...dbRestaurants].slice(0, 10);
  }
  const q = query.toLowerCase();
  const all = [...dbRestaurants, ...RESTAURANT_SEED.map((r, i) => ({ ...r, id: `seed-${i}` }))];
  return all.filter((r) => r.name.toLowerCase().includes(q)).slice(0, 8);
}

export function applyRestaurantAdjustments(
  nutrition: { calories: number; protein: number; carbs: number; fats: number; sodium?: number },
  restaurant: RestaurantInfo | null
) {
  if (!restaurant) return nutrition;
  const sodiumMult =
    restaurant.sodiumLevel === "very_high" ? 1.35 : restaurant.sodiumLevel === "high" ? 1.2 : 1.05;
  return {
    ...nutrition,
    sodium: Math.round((nutrition.sodium ?? 400) * sodiumMult),
    calories: Math.round(nutrition.calories * 1.08),
  };
}

export function restaurantWarnings(restaurant: RestaurantInfo, avoidGmo: boolean): string[] {
  const warnings: string[] = [];
  if (restaurant.sodiumLevel === "very_high" || restaurant.sodiumLevel === "high") {
    warnings.push(`${restaurant.name} is known for high-sodium meals — budget your salt for the rest of today`);
  }
  if (avoidGmo && (restaurant.gmoRisk === "high" || restaurant.gmoRisk === "moderate")) {
    warnings.push(`${restaurant.name} may use GMO oils and ingredients commonly flagged by health-conscious eaters`);
  }
  if (restaurant.processingLevel === "high") {
    warnings.push(`${restaurant.name} relies heavily on processed ingredients — review before you order`);
  }
  if (restaurant.notes) warnings.push(restaurant.notes);
  return warnings;
}
