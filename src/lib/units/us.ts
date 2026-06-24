// src/lib/units/us.ts — US customary units (display + input); store metric internally in DB.

export const LB_PER_KG = 2.2046226218;
export const KG_PER_LB = 1 / LB_PER_KG;
export const ML_PER_FL_OZ = 29.5735295625;
export const CM_PER_INCH = 2.54;

/** Standard US glass of water */
export const GLASS_FL_OZ = 8;
export const GLASS_WATER_ML = Math.round(GLASS_FL_OZ * ML_PER_FL_OZ);

export function kgToLbs(kg: number): number {
  return kg * LB_PER_KG;
}

export function lbsToKg(lbs: number): number {
  return lbs * KG_PER_LB;
}

export function mlToFlOz(ml: number): number {
  return ml / ML_PER_FL_OZ;
}

export function flOzToMl(flOz: number): number {
  return flOz * ML_PER_FL_OZ;
}

export function cmToInches(cm: number): number {
  return cm / CM_PER_INCH;
}

export function inchesToCm(inches: number): number {
  return inches * CM_PER_INCH;
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = Math.round(cmToInches(cm));
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}

export function feetInchesToCm(feet: number, inches: number): number {
  return inchesToCm(feet * 12 + inches);
}

export function formatWeightLbs(kg: number, decimals = 0): string {
  const lbs = kgToLbs(kg);
  const value = decimals > 0 ? lbs.toFixed(decimals) : String(Math.round(lbs));
  return `${value} lbs`;
}

export function formatWaterFlOz(ml: number, decimals = 0): string {
  const flOz = mlToFlOz(ml);
  const value = decimals > 0 ? flOz.toFixed(decimals) : String(Math.round(flOz));
  return `${value} fl oz`;
}

export function formatHeightFtIn(cm: number): string {
  const { feet, inches } = cmToFeetInches(cm);
  return `${feet}'${inches}"`;
}
