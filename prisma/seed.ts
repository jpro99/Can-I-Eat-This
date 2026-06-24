// prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import { RESTAURANT_SEED } from "../src/lib/restaurants/knowledge";

const prisma = new PrismaClient();

async function main() {
  await prisma.foodCatalog.createMany({
    data: [
      {
        name: "Large egg",
        servingSize: "1 egg",
        calories: 72,
        protein: 6,
        carbs: 0.4,
        fats: 5,
        fiber: 0,
        sodium: 71,
        micronutrients: JSON.stringify({ vitaminD: 1, vitaminB12: 0.6, iron: 0.9 }),
        ingredients: "Egg",
        source: "usda",
      },
      {
        name: "Chicken breast grilled",
        servingSize: "100g",
        servingGrams: 100,
        calories: 165,
        protein: 31,
        carbs: 0,
        fats: 3.6,
        fiber: 0,
        sodium: 74,
        micronutrients: JSON.stringify({ vitaminB12: 0.3, zinc: 1, potassium: 256 }),
        ingredients: "Chicken breast",
        source: "usda",
      },
      {
        name: "Banana",
        servingSize: "1 medium",
        calories: 105,
        protein: 1.3,
        carbs: 27,
        fats: 0.4,
        sugar: 14,
        fiber: 3,
        sodium: 1,
        micronutrients: JSON.stringify({ vitaminC: 10, potassium: 422, vitaminB6: 0.4 }),
        ingredients: "Banana",
        source: "usda",
      },
      {
        name: "Greek yogurt plain",
        brand: "Generic",
        servingSize: "170g",
        calories: 100,
        protein: 17,
        carbs: 6,
        fats: 0.7,
        sugar: 4,
        sodium: 65,
        micronutrients: JSON.stringify({ calcium: 187, vitaminB12: 1.2, potassium: 220 }),
        ingredients: "Cultured pasteurized nonfat milk",
        source: "usda",
      },
      {
        name: "Protein shake",
        servingSize: "1 scoop",
        calories: 120,
        protein: 24,
        carbs: 3,
        fats: 1.5,
        sugar: 1,
        sodium: 130,
        micronutrients: JSON.stringify({ calcium: 100, vitaminB12: 0.5 }),
        ingredients: "Whey protein isolate, natural flavors, stevia",
        source: "manual",
      },
      {
        name: "Salmon fillet",
        servingSize: "100g",
        calories: 208,
        protein: 20,
        carbs: 0,
        fats: 13,
        sodium: 59,
        micronutrients: JSON.stringify({ vitaminD: 11, omega3: 2.2, vitaminB12: 3.2, potassium: 384 }),
        ingredients: "Salmon",
        source: "usda",
      },
    ],
  });

  for (const r of RESTAURANT_SEED) {
    await prisma.restaurantKnowledge.upsert({
      where: { slug: r.slug },
      create: {
        name: r.name,
        slug: r.slug,
        sodiumLevel: r.sodiumLevel,
        gmoRisk: r.gmoRisk,
        processingLevel: r.processingLevel,
        notes: r.notes,
        tips: JSON.stringify(r.tips),
      },
      update: {
        notes: r.notes,
        tips: JSON.stringify(r.tips),
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
