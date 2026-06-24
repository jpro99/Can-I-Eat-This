// src/app/onboarding/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { Scan, Shield, TrendingUp } from "lucide-react";

const slides = [
  {
    icon: Scan,
    title: "Scan in seconds",
    body: "Barcode, label photo, or plate photo — Caveman picks the fastest way to log your food.",
  },
  {
    icon: Shield,
    title: "Know before you eat",
    body: "Get a clear Eat, Caution, or Avoid verdict based on your goals, ingredients, and daily budget.",
  },
  {
    icon: TrendingUp,
    title: "Track with confidence",
    body: "Automatic daily logging, ingredient flags, and printable reports you can share.",
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const slide = slides[step];
  const Icon = slide.icon;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-neutral-50 px-6 pb-10 pt-safe-top dark:bg-neutral-950">
      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="text-center"
          >
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
              <Icon size={40} strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">{slide.title}</h1>
            <p className="mx-auto mt-4 max-w-sm text-lg leading-relaxed text-neutral-500">{slide.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-2 py-6">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${i === step ? "w-6 bg-neutral-900 dark:bg-white" : "w-2 bg-neutral-300"}`}
          />
        ))}
      </div>

      <Button
        size="xl"
        className="w-full"
        onClick={() => {
          if (step < slides.length - 1) setStep(step + 1);
          else router.push("/profile/setup");
        }}
      >
        {step < slides.length - 1 ? "Continue" : "Set up profile"}
      </Button>
    </div>
  );
}
