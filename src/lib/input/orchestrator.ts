// src/lib/input/orchestrator.ts

export type InputMode = "barcode" | "label" | "plate" | "voice" | "manual";

export function suggestInputMode(context: {
  hasBarcode?: boolean;
  hasLabel?: boolean;
  isPreparedFood?: boolean;
}): InputMode {
  if (context.hasBarcode) return "barcode";
  if (context.hasLabel) return "label";
  if (context.isPreparedFood) return "plate";
  return "manual";
}

export function inputModeHint(mode: InputMode): string {
  switch (mode) {
    case "barcode":
      return "Packaged food? Scan the barcode first.";
    case "label":
      return "Nutrition label visible? Snap the label.";
    case "plate":
      return "Prepared meal? Photo the plate.";
    case "voice":
      return "In a hurry? Say what you ate.";
    default:
      return "Search by name as a fallback.";
  }
}
