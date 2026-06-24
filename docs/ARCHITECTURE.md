# Caveman — Product Architecture (Phase 1)

## Product Team Review: Add Two, Defer Two

Before building, the senior product team recommends these adjustments to your spec:

### ADD (high ROI, low scope)

1. **One-Tap Repeat Meals** — Save and re-log entire meals or frequent foods in one tap from Today. This cuts daily logging time by ~40% and is essential for habit formation. (Partially implied by "recent foods" — we elevate it to first-class.)

2. **Auto Meal Slot Detection** — Automatically assign breakfast/lunch/dinner/snack based on time of day. User can override with one tap. Removes a form field from every log entry.

### DEFER (MVP scope control)

1. **Voice Input as primary path on iOS** — Web Speech API is unreliable in iOS Safari PWAs (requires network, inconsistent permissions, no background). We **include** voice with graceful fallback and a "type instead" path, but do not optimize the core flow around it until a native wrapper or better iOS support.

2. **Full micronutrient database** — Track macros + sodium/sugar/fiber/cholesterol in MVP. Expand vitamins/minerals in v1.1 when we add USDA FoodData Central deep integration.

---

## 1. Product Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Caveman PWA (Next.js 15)                  │
├─────────────────────────────────────────────────────────────────┤
│  Presentation Layer                                              │
│  ├─ App Router pages (mobile-first, standalone PWA)              │
│  ├─ Shared UI components (Apple-clean design system)            │
│  └─ Client hooks (camera, barcode, offline cache)               │
├─────────────────────────────────────────────────────────────────┤
│  Application Layer                                               │
│  ├─ Decision Engine (Caveman Score 0–100 → Eat/Caution/Avoid)   │
│  ├─ Ingredient Risk Engine (flags, avoid-list, strictness)      │
│  ├─ Nutrition Calculator (TDEE, macro targets, daily budget)    │
│  └─ Input Orchestrator (smart mode selection)                   │
├─────────────────────────────────────────────────────────────────┤
│  Integration Layer                                               │
│  ├─ Open Food Facts (barcode lookup, free)                      │
│  ├─ OpenAI Vision (label OCR parse, plate photo analysis)       │
│  ├─ Tesseract.js (client-side OCR fallback)                     │
│  ├─ Web Speech API (voice → structured meal)                    │
│  └─ jsPDF + CSV export                                          │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer                                                      │
│  ├─ Prisma ORM + SQLite (dev) / PostgreSQL (prod)               │
│  ├─ LocalStorage profile cache (offline bootstrap)              │
│  └─ Service Worker cache (shell + recent logs)                  │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Feature Map

| Domain | Features | MVP |
|--------|----------|-----|
| Profile | Name, stats, goals, macros, allergies, avoid-list, strictness | ✅ |
| Input | Barcode, label OCR, plate AI, manual search, voice | ✅ |
| Decision | Caveman Score, Eat/Caution/Avoid, reason bullets | ✅ |
| Ingredients | Dye/preservative/HFCS/seed oil/allergen flags | ✅ |
| Log | Daily timeline, edit, photos, confidence, source type | ✅ |
| Today | Macro rings, remaining budget, flag count, quick actions | ✅ |
| History | 7/30/custom ranges, trends, top foods | ✅ |
| Export | PDF + CSV + print-ready reports | ✅ |
| PWA | Manifest, SW, standalone, icons, offline shell | ✅ |
| Repeat Meals | Save & one-tap re-log | ✅ (added) |
| Weight Log | Manual weight entries for trend | ✅ (added) |

## 3. User Flow

```
Install PWA → Onboarding (3 slides) → Profile Setup → Today Dashboard
                                                      ↓
                              ┌───────────────────────┴───────────────────────┐
                              │              Add Food (FAB)                  │
                              └───────────────────────┬───────────────────────┘
                                                      ↓
                              ┌───────────────────────────────────────────────┐
                              │           Scan Chooser (smart hints)           │
                              │  Barcode | Label Photo | Plate Photo | Voice  │
                              │  Manual Search | Recent / Repeat Meals         │
                              └───────────────────────┬───────────────────────┘
                                                      ↓
                              Capture / Scan / Speak / Search
                                                      ↓
                              Parse → Decision Card (Score + Verdict)
                                                      ↓
                              Edit servings / items / ingredients
                                                      ↓
                              Save to Log → Today updates instantly
```

## 4. Data Model

```
UserProfile (1)
├── id, name, age, sex, height, weight, goalWeight
├── activityLevel, healthGoal, strictness
├── targetCalories, targetProtein, targetCarbs, targetFats
├── targetFiber, targetSodium, targetSugar
├── allergies[], foodsToAvoid[], ingredientClassesToAvoid[]
├── scoreThresholds { eat: 80, caution: 55 }
└── onboardingComplete

WeightEntry (*)
├── profileId, weight, recordedAt

FoodEntry (catalog / cache)
├── name, brand, barcode, source
├── nutrition per serving
└── ingredients[]

MealLog (*)
├── profileId, timestamp, mealType (auto-detected)
├── sourceType: barcode|label_ocr|plate_ai|voice|manual|repeat
├── foodName, brand, servings, servingSize
├── photoUrl?, confidence, isEstimated
├── calories, protein, carbs, fats, saturatedFat, sugar, addedSugar
├── fiber, sodium, cholesterol
├── ingredientFlags[], decisionScore, decisionVerdict
├── decisionReasons[], userCorrections?
└── rawData (JSON)

SavedMeal (*)
├── profileId, name, items[] (for repeat meals)

IngredientFlag (reference)
├── name, category, severity, whyFlagged
```

## 5. API Plan

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/barcode/[code]` | GET | Open Food Facts lookup |
| `/api/ocr/label` | POST | Image → structured nutrition + ingredients |
| `/api/ai/plate` | POST | Image → detected items + estimates |
| `/api/ai/voice` | POST | Transcript → structured meal |
| `/api/food/search` | GET | Local DB + OFF search |
| `/api/profile` | GET/PUT | Profile CRUD |
| `/api/logs` | GET/POST/PUT/DELETE | Meal log CRUD |
| `/api/logs/today` | GET | Today's aggregated data |
| `/api/history` | GET | Range queries + aggregates |
| `/api/export/pdf` | POST | Generate PDF report |
| `/api/export/csv` | POST | Generate CSV report |
| `/api/weight` | GET/POST | Weight entries |
| `/api/meals/saved` | GET/POST | Repeat meals |

## 6. Scoring Logic

**Caveman Score (0–100)** — weighted factors:

| Factor | Weight | Logic |
|--------|--------|-------|
| Calorie fit | 15% | Penalty if item exceeds remaining daily budget proportionally |
| Protein fit | 12% | Bonus for high protein vs goal; penalty if low when goal is muscle gain |
| Macro fit | 10% | Carbs/fats vs remaining targets |
| Sugar load | 12% | Penalty above thresholds; stricter for fat loss |
| Sodium load | 10% | Penalty above daily proportion |
| Fiber value | 8% | Bonus for fiber content |
| Ingredient risk | 15% | Per flagged ingredient, weighted by category severity |
| Additive/dye score | 10% | Artificial dyes, preservatives |
| Processing score | 8% | Highly processed ingredient count |
| Goal fit | 10% | Health goal alignment |

**Verdict mapping (configurable):**
- 80–100 → Eat (green)
- 55–79 → Caution (yellow)
- <55 → Avoid (red)

Strictness multiplier: strict ×1.3 penalties, flexible ×0.7.

## 7. Recommended Libraries/Services

| Need | Choice | Why |
|------|--------|-----|
| Framework | Next.js 15 App Router | PWA-ready, API routes, SSR |
| DB | Prisma + SQLite/Postgres | Type-safe, easy migration |
| PWA | Serwist | Modern SW for Next.js |
| Barcode | @zxing/browser + Open Food Facts | Free, no API key |
| OCR | Tesseract.js (client) + OpenAI (parse) | Fallback + accuracy |
| Plate AI | OpenAI GPT-4o vision | Best plate detection MVP |
| Voice | Web Speech API + OpenAI parse | Works on Android/desktop |
| PDF | jsPDF + autotable | Client-side export |
| Animation | Framer Motion | Subtle Apple-like transitions |
| Icons | Lucide | Clean, consistent |
| Validation | Zod | API input safety |

## 8. File Tree

```
c:\Projects\Can_I-Eat-It\
├── package.json
├── next.config.ts
├── tsconfig.json
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   ├── manifest.json
│   ├── icons/ (192, 512)
│   └── sw.js (generated)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── onboarding/page.tsx
│   │   ├── profile/setup/page.tsx
│   │   ├── today/page.tsx
│   │   ├── scan/page.tsx
│   │   ├── scan/barcode/page.tsx
│   │   ├── scan/label/page.tsx
│   │   ├── scan/plate/page.tsx
│   │   ├── scan/voice/page.tsx
│   │   ├── scan/manual/page.tsx
│   │   ├── scan/result/page.tsx
│   │   ├── scan/serving/page.tsx
│   │   ├── meal/[id]/page.tsx
│   │   ├── ingredient/[slug]/page.tsx
│   │   ├── history/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── settings/goals/page.tsx
│   │   ├── settings/avoid/page.tsx
│   │   └── api/...
│   ├── components/
│   │   ├── ui/ (Button, Card, Input, Progress, Badge, etc.)
│   │   ├── layout/ (AppShell, BottomNav, Header)
│   │   ├── scan/ (CameraCapture, BarcodeScanner)
│   │   ├── food/ (DecisionCard, MacroRing, MealTimeline)
│   │   └── export/ (ReportPreview)
│   ├── lib/
│   │   ├── db.ts
│   │   ├── scoring/decision-engine.ts
│   │   ├── scoring/caveman-score.ts
│   │   ├── ingredients/flags.ts
│   │   ├── ingredients/parser.ts
│   │   ├── nutrition/calculator.ts
│   │   ├── nutrition/aggregates.ts
│   │   ├── barcode/open-food-facts.ts
│   │   ├── ocr/tesseract.ts
│   │   ├── ai/openai.ts
│   │   ├── ai/prompts.ts
│   │   ├── export/pdf.ts
│   │   ├── export/csv.ts
│   │   ├── pwa/install.ts
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── useProfile.ts
│   │   ├── useCamera.ts
│   │   └── useSpeech.ts
│   ├── types/index.ts
│   └── sw.ts
└── docs/ARCHITECTURE.md
```

---

Proceeding to Phase 2: full implementation.
