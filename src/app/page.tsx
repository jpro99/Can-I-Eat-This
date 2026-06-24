// src/app/page.tsx

import { redirect } from "next/navigation";
import { getOrCreateProfile } from "@/lib/db";

export default async function HomePage() {
  const profile = await getOrCreateProfile();
  if (!profile.onboardingComplete) {
    redirect("/onboarding");
  }
  redirect("/today");
}
