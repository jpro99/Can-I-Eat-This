// src/lib/ingredients/flags.ts

import type { IngredientFlag, UserProfileData } from "@/types";

interface FlagRule {
  pattern: RegExp;
  name: string;
  category: string;
  severity: "low" | "medium" | "high";
  whyFlagged: string;
}

const FLAG_RULES: FlagRule[] = [
  {
    pattern: /red\s*40|yellow\s*5|yellow\s*6|blue\s*1|blue\s*2|green\s*3|artificial\s*(color|colour|dye)/i,
    name: "Artificial food dye",
    category: "artificial_dye",
    severity: "high",
    whyFlagged: "Synthetic dye commonly avoided by users seeking cleaner ingredient lists.",
  },
  {
    pattern: /high fructose corn syrup|hfcs/i,
    name: "High fructose corn syrup",
    category: "sweetener",
    severity: "high",
    whyFlagged: "Highly processed sweetener often limited on clean-eating and fat-loss plans.",
  },
  {
    pattern: /aspartame|sucralose|acesulfame|saccharin|neotame| advantame/i,
    name: "Artificial sweetener",
    category: "artificial_sweetener",
    severity: "medium",
    whyFlagged: "Non-nutritive sweetener flagged based on your ingredient preferences.",
  },
  {
    pattern: /sodium nitrite|sodium nitrate|potassium nitrate|potassium nitrite/i,
    name: "Nitrate/Nitrite",
    category: "preservative",
    severity: "high",
    whyFlagged: "Cured-meat preservative commonly reviewed by users limiting processed meats.",
  },
  {
    pattern: /bha|bht|tbhq|sodium benzoate|potassium sorbate|calcium propionate|sodium sulfite/i,
    name: "Synthetic preservative",
    category: "preservative",
    severity: "medium",
    whyFlagged: "Preservative additive flagged for review under your processing preferences.",
  },
  {
    pattern: /titanium dioxide/i,
    name: "Titanium dioxide",
    category: "additive",
    severity: "medium",
    whyFlagged: "Color additive some users choose to avoid in ultra-processed foods.",
  },
  {
    pattern: /partially hydrogenated|hydrogenated oil/i,
    name: "Hydrogenated oil",
    category: "processed_fat",
    severity: "high",
    whyFlagged: "Industrial fat source often limited on heart-health and clean-eating plans.",
  },
  {
    pattern: /maltodextrin|dextrose|corn syrup solids|modified starch|modified food starch/i,
    name: "Highly processed starch/sugar",
    category: "processing",
    severity: "medium",
    whyFlagged: "Refined processing ingredient that can spike blood sugar quickly.",
  },
  {
    pattern: /canola oil|soybean oil|corn oil|sunflower oil|safflower oil|cottonseed oil|grapeseed oil|rice bran oil/i,
    name: "Seed oil",
    category: "seed_oil",
    severity: "low",
    whyFlagged: "Seed oil flagged because you chose to review these in settings.",
  },
  {
    pattern: /carrageenan|polysorbate|propylene glycol|monosodium glutamate|\bmsg\b/i,
    name: "Processing additive",
    category: "additive",
    severity: "low",
    whyFlagged: "Common additive flagged for review based on your clean-eating settings.",
  },
];

const ALLERGEN_PATTERNS: Record<string, RegExp> = {
  milk: /milk|whey|casein|lactose|cheese|butter|cream/i,
  eggs: /egg|albumin|lysozyme|mayonnaise/i,
  peanuts: /peanut/i,
  tree_nuts: /almond|walnut|pecan|cashew|pistachio|hazelnut|macadamia/i,
  wheat: /wheat|gluten|flour|semolina|spelt/i,
  soy: /soy|soya|edamame|tofu|tempeh/i,
  fish: /fish|anchov|cod|salmon|tuna|bass/i,
  shellfish: /shrimp|crab|lobster|shellfish|mollusk/i,
  sesame: /sesame|tahini/i,
};

export function analyzeIngredients(
  ingredientsText: string,
  profile: Pick<UserProfileData, "allergies" | "foodsToAvoid" | "ingredientClassesToAvoid" | "avoidSeedOils">
): IngredientFlag[] {
  const flags: IngredientFlag[] = [];
  const seen = new Set<string>();
  const text = ingredientsText.toLowerCase();

  for (const rule of FLAG_RULES) {
    if (rule.category === "seed_oil" && !profile.avoidSeedOils) continue;
    if (
      profile.ingredientClassesToAvoid.length > 0 &&
      !profile.ingredientClassesToAvoid.includes(rule.category) &&
      ["artificial_dye", "preservative", "sweetener", "artificial_sweetener", "processing"].includes(rule.category)
    ) {
      continue;
    }
    if (rule.pattern.test(text)) {
      const key = `${rule.category}:${rule.name}`;
      if (!seen.has(key)) {
        seen.add(key);
        flags.push({
          name: rule.name,
          category: rule.category,
          severity: rule.severity,
          whyFlagged: rule.whyFlagged,
        });
      }
    }
  }

  for (const allergy of profile.allergies) {
    const pattern = ALLERGEN_PATTERNS[allergy.toLowerCase()] ?? new RegExp(allergy, "i");
    if (pattern.test(text)) {
      const key = `allergen:${allergy}`;
      if (!seen.has(key)) {
        seen.add(key);
        flags.push({
          name: `${allergy} allergen`,
          category: "allergen",
          severity: "high",
          whyFlagged: `Contains an ingredient that may match your ${allergy} allergy setting.`,
        });
      }
    }
  }

  for (const avoid of profile.foodsToAvoid) {
    if (avoid && text.includes(avoid.toLowerCase())) {
      const key = `avoid:${avoid}`;
      if (!seen.has(key)) {
        seen.add(key);
        flags.push({
          name: avoid,
          category: "custom_avoid",
          severity: "high",
          whyFlagged: `Matches an item on your personal avoid list.`,
        });
      }
    }
  }

  return flags;
}

export function ingredientRiskScore(flags: IngredientFlag[]): number {
  if (flags.length === 0) return 100;
  let penalty = 0;
  for (const flag of flags) {
    if (flag.severity === "high") penalty += 18;
    else if (flag.severity === "medium") penalty += 10;
    else penalty += 5;
  }
  return Math.max(0, 100 - penalty);
}

export function getIngredientDetail(slug: string) {
  const decoded = decodeURIComponent(slug);
  const rule = FLAG_RULES.find((r) => r.name.toLowerCase().replace(/\s+/g, "-") === decoded);
  if (rule) {
    return {
      name: rule.name,
      category: rule.category,
      severity: rule.severity,
      whyFlagged: rule.whyFlagged,
      guidance:
        "This is informational guidance based on your settings, not a medical diagnosis. Review labels and consult a qualified professional for personal health decisions.",
    };
  }
  return {
    name: decoded.replace(/-/g, " "),
    category: "custom",
    severity: "medium" as const,
    whyFlagged: "Flagged based on your personal avoid-list or allergy settings.",
    guidance:
      "This is informational guidance based on your settings, not a medical diagnosis.",
  };
}

export const INGREDIENT_CATEGORIES = [
  { id: "artificial_dye", label: "Artificial dyes" },
  { id: "preservative", label: "Preservatives" },
  { id: "sweetener", label: "HFCS & sweeteners" },
  { id: "artificial_sweetener", label: "Artificial sweeteners" },
  { id: "seed_oil", label: "Seed oils" },
  { id: "processing", label: "Highly processed ingredients" },
  { id: "additive", label: "Other additives" },
];
