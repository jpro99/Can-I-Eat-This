// src/types/index.ts

export type Sex = "male" | "female" | "other";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type HealthGoal = "fat_loss" | "maintain" | "muscle_gain" | "clean_eating";
export type Strictness = "strict" | "moderate" | "flexible";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type MealOrigin = "homemade" | "store" | "restaurant";
export type PortionMethod = "visual_palm" | "visual_fist" | "visual_cup" | "scale" | "label" | "default";
export type SourceType = "barcode" | "label_ocr" | "plate_ai" | "voice" | "manual" | "repeat";
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

export interface DailySummary {
  date: string;
  consumed: NutritionFacts & { micronutrients?: Micronutrients };
  targets: NutritionFacts & { calories: number; micronutrients?: Micronutrients };
  remaining: NutritionFacts & { calories: number };
  waterConsumedMl: number;
  waterTargetMl: number;
  flagCount: number;
  meals: MealLogItem[];
  insights: CoachInsight[];
  micronutrientStatus: MicronutrientStatus[];
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
