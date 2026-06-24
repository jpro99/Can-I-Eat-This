// src/types/index.ts

export type Sex = "male" | "female" | "other";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type HealthGoal = "fat_loss" | "maintain" | "muscle_gain" | "clean_eating";
export type Strictness = "strict" | "moderate" | "flexible";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type MealOrigin = "homemade" | "store" | "restaurant";
export type PortionMethod =
  | "restaurant_small"
  | "restaurant_regular"
  | "restaurant_large"
  | "shared"
  | "half_plate"
  | "quarter_cup"
  | "half_cup"
  | "cup"
  | "two_cups"
  | "oz_3"
  | "oz_4"
  | "oz_6"
  | "oz_8"
  | "tbsp"
  | "slice"
  | "piece"
  | "visual_palm"
  | "visual_fist"
  | "visual_cup"
  | "visual_thumb"
  | "scale"
  | "label"
  | "default";
export type SourceType =
  | "barcode"
  | "label_ocr"
  | "plate_ai"
  | "voice"
  | "manual"
  | "repeat"
  | "routine"
  | "appliance"
  | "venue"
  | "template"
  | "kitchen_memory";
export type Verdict = "eat" | "caution" | "avoid";

export interface Micronutrients {
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
  vitaminE?: number;
  vitaminK?: number;
  vitaminB12?: number;
  folate?: number;
  iron?: number;
  calcium?: number;
  magnesium?: number;
  potassium?: number;
  zinc?: number;
  omega3?: number;
}

export interface Supplement {
  id: string;
  name: string;
  active: boolean;
  requiresHydration?: boolean;
  hydrationNote?: string;
}

/** Slider add-on for a daily routine (cream, milk, hot sauce, etc.) */
export interface RoutineModifier {
  id: string;
  label: string;
  unit: string;
  maxUnits: number;
  caloriesPerUnit: number;
  proteinPerUnit: number;
  carbsPerUnit: number;
  fatsPerUnit: number;
  sugarPerUnit?: number;
  sodiumPerUnit?: number;
}

/** One-tap daily item with saved modifier levels (e.g. morning coffee + cream) */
export interface DailyRoutine {
  id: string;
  name: string;
  emoji?: string;
  mealType: MealType;
  showInMorning: boolean;
  base: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    sugar?: number;
    sodium?: number;
    fiber?: number;
  };
  modifiers: RoutineModifier[];
  /** Slider level 0–100 per modifier id */
  defaults: Record<string, number>;
  servingDescription?: string;
}

// ─── Kitchen Memory ───────────────────────────────────────────────────────────

export type PantryItemType =
  | "whole_milk"
  | "skim_milk"
  | "oat_milk"
  | "almond_milk"
  | "cream"
  | "half_and_half"
  | "spice"
  | "sauce"
  | "other";

export type ApplianceCategory = "super_automatic" | "semi_automatic" | "pod" | "drip";

export interface DispenseChannelSpec {
  id: string;
  label: string;
  mlPerSecond: number;
  maxSeconds: number;
  defaultLiquidType: PantryItemType;
  /** Setup / log hint — e.g. "Match the seconds on your Jura display" */
  setupHint?: string;
}

/** Built-in drink program on the machine (Flat White, Cappuccino, etc.) */
export interface MachineDrinkPreset {
  id: string;
  label: string;
  channelSeconds: Record<string, number>;
  /** Products that must be label-scanned for this drink (e.g. milk + cream in G3 system) */
  requiredPantryTypes?: PantryItemType[];
}

export interface ApplianceCatalogModel {
  id: string;
  manufacturerId: string;
  name: string;
  fullName: string;
  category: ApplianceCategory;
  channels: DispenseChannelSpec[];
  drinkPresets?: MachineDrinkPreset[];
  espressoBaseMl?: number;
  notes?: string;
}

export interface ApplianceManufacturer {
  id: string;
  name: string;
}

export interface PantryItem {
  id: string;
  name: string;
  type: PantryItemType;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  sugar?: number;
  sodium?: number;
  perTsp?: boolean;
  photoNote?: string;
  brand?: string;
  servingSize?: string;
  /** True only after user photographed the nutrition label — never guess when false */
  labelVerified?: boolean;
  labelScannedAt?: string;
}

export interface ConfiguredAppliance {
  id: string;
  catalogModelId: string;
  nickname: string;
  channelSeconds: Record<string, number>;
  channelPantryIds: Record<string, string>;
  channelMlPerSecond?: Record<string, number>;
  /** Per-channel slider ceiling (e.g. 60s milk on a tuned Jura) */
  channelMaxSeconds?: Record<string, number>;
  calibrationFactor: number;
  includeEspresso: boolean;
  showInMorning: boolean;
  vesselLabel?: string;
  /** Machine drink program the user usually runs (flat_white, cappuccino, …) */
  usualDrinkId?: string;
  usualDrinkLabel?: string;
}

export interface VenueOrderTemplate {
  id: string;
  venueId: string;
  venueName: string;
  itemName: string;
  size?: string;
  customizations?: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    sugar?: number;
    sodium?: number;
    fiber?: number;
  };
  showInMorning?: boolean;
}

export interface SpiceSet {
  id: string;
  name: string;
  pantryItemIds: string[];
  tspPerMeal: number;
}

export interface MealTemplate {
  id: string;
  name: string;
  mealType: MealType;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    sugar?: number;
    sodium?: number;
    fiber?: number;
  };
  spiceSetId?: string;
  ingredients?: string;
  showAtHours?: number[];
}

export interface KitchenMemory {
  setupComplete: boolean;
  pantryItems: PantryItem[];
  appliances: ConfiguredAppliance[];
  venueOrders: VenueOrderTemplate[];
  spiceSets: SpiceSet[];
  mealTemplates: MealTemplate[];
}

export interface KitchenPrediction {
  id: string;
  type: "appliance" | "venue" | "template" | "routine";
  label: string;
  emoji: string;
  description: string;
  confidence: number;
  sourceId: string;
  alreadyLoggedToday?: boolean;
}

export interface NutritionFacts {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  saturatedFat?: number;
  sugar?: number;
  addedSugar?: number;
  fiber?: number;
  sodium?: number;
  cholesterol?: number;
  micronutrients?: Micronutrients;
}

export interface IngredientFlag {
  name: string;
  category: string;
  severity: "low" | "medium" | "high";
  whyFlagged: string;
}

export interface MealContext {
  mealOrigin?: MealOrigin;
  restaurantName?: string;
  restaurantId?: string;
  portionMethod?: PortionMethod;
  servings?: number;
}

export interface RestaurantInfo {
  id: string;
  name: string;
  slug: string;
  sodiumLevel: "low" | "moderate" | "high" | "very_high";
  gmoRisk: "low" | "moderate" | "high" | "unknown";
  processingLevel: "low" | "moderate" | "high";
  notes: string;
  tips: string[];
}

export interface FoodAnalysis {
  foodName: string;
  brand?: string;
  servingSize?: string;
  servings?: number;
  nutrition: NutritionFacts;
  ingredients: string;
  ingredientFlags: IngredientFlag[];
  confidence: number;
  isEstimated: boolean;
  sourceType: SourceType;
  photoUrl?: string;
  items?: PlateItem[];
  mealContext?: MealContext;
  rawData?: unknown;
}

export interface PlateItem {
  id: string;
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  confidence: number;
}

export interface DecisionResult {
  score: number;
  verdict: Verdict;
  reasons: string[];
  positives: string[];
  negatives: string[];
  forYouSummary: string;
  suggestions: string[];
}

export interface UserProfileData {
  id: string;
  name: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  goalWeightKg?: number | null;
  activityLevel: ActivityLevel;
  healthGoal: HealthGoal;
  strictness: Strictness;
  targetCalories?: number | null;
  targetProtein?: number | null;
  targetCarbs?: number | null;
  targetFats?: number | null;
  targetFiber?: number | null;
  targetSodium?: number | null;
  targetSugar?: number | null;
  targetWaterMl?: number | null;
  supplements: Supplement[];
  avoidGmo: boolean;
  allergies: string[];
  foodsToAvoid: string[];
  ingredientClassesToAvoid: string[];
  avoidSeedOils: boolean;
  scoreEatThreshold: number;
  scoreCautionThreshold: number;
  onboardingComplete: boolean;
  dailyRoutines: DailyRoutine[];
  kitchenMemory: KitchenMemory;
}

export interface DailyCoachContext {
  profile: UserProfileData;
  consumed: NutritionFacts & { micronutrients: Micronutrients };
  targets: NutritionFacts & { calories: number; micronutrients: Micronutrients };
  remaining: NutritionFacts & { calories: number };
  waterConsumedMl: number;
  waterTargetMl: number;
  proteinPctOfTarget: number;
  hoursLeftInDay: number;
  flagCount: number;
  mealsLoggedCount: number;
}

export interface CoachInsight {
  id: string;
  severity: "info" | "warning" | "critical" | "success";
  title: string;
  body: string;
  action?: string;
}

export interface MicronutrientStatus {
  key: keyof Micronutrients;
  label: string;
  unit: string;
  consumed: number;
  target: number;
  pct: number;
  status: "good" | "low" | "depleted";
}

export type ActivityType = "walk" | "run" | "hike" | "cycle" | "workout" | "steps" | "other";

export interface ActivityLogItem {
  id: string;
  activityType: ActivityType;
  label: string;
  durationMin: number;
  distanceKm?: number;
  steps?: number;
  caloriesBurned: number;
  source: "manual" | "gps" | "steps";
  notes?: string;
  recordedAt: string;
}

export interface DailySummary {
  date: string;
  consumed: NutritionFacts & { micronutrients?: Micronutrients };
  targets: NutritionFacts & { calories: number; micronutrients?: Micronutrients };
  remaining: NutritionFacts & { calories: number };
  caloriesBurned: number;
  netCalories: number;
  effectiveRemainingCalories: number;
  activities: ActivityLogItem[];
  waterConsumedMl: number;
  waterTargetMl: number;
  flagCount: number;
  meals: MealLogItem[];
  insights: CoachInsight[];
  micronutrientStatus: MicronutrientStatus[];
  kitchenPredictions?: KitchenPrediction[];
}

export interface MealLogItem {
  id: string;
  timestamp: string;
  mealType: MealType;
  mealOrigin?: MealOrigin | null;
  restaurantName?: string | null;
  sourceType: SourceType;
  foodName: string;
  brand?: string | null;
  servings: number;
  servingSize?: string | null;
  photoUrl?: string | null;
  confidence: number;
  isEstimated: boolean;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  saturatedFat: number;
  sugar: number;
  addedSugar: number;
  fiber: number;
  sodium: number;
  cholesterol: number;
  micronutrients?: Micronutrients;
  ingredients: string;
  ingredientFlags: IngredientFlag[];
  decisionScore: number;
  decisionVerdict: Verdict;
  decisionReasons: string[];
  forYouSummary?: string | null;
}

export interface HistorySummary {
  startDate: string;
  endDate: string;
  totalCalories: number;
  avgCalories: number;
  totalProtein: number;
  avgProtein: number;
  avgCarbs: number;
  avgFats: number;
  avgSugar: number;
  avgSodium: number;
  avgFiber: number;
  flagCount: number;
  topFoods: { name: string; count: number }[];
  greenFoods: { name: string; count: number }[];
  redFoods: { name: string; count: number }[];
  dailyTrends: {
    date: string;
    calories: number;
    protein: number;
    sugar: number;
    sodium: number;
    fiber: number;
    flags: number;
  }[];
  weightTrend: { date: string; weightKg: number }[];
}

export interface ScanSession {
  analysis: FoodAnalysis;
  decision: DecisionResult;
  mealContext?: MealContext;
}

export const PROTEIN_RICH_FOODS = [
  "Greek yogurt (plain)",
  "Chicken breast",
  "Eggs (2–3)",
  "Cottage cheese",
  "Salmon or tuna",
  "Protein shake",
  "Lean steak",
  "Lentils or black beans",
  "Turkey breast",
  "Edamame",
];
