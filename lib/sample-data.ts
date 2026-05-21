import type { Powertrain } from "@/lib/types";

export const POWERTRAIN_LABELS: Record<Powertrain, string> = {
  ICE_HEV: "ICE/HEV",
  PHEV: "PHEV",
  BEV_SMALL: "BEV（小型）",
  BEV_NORMAL: "BEV（通常）",
};

export const PORTFOLIO_LABELS = {
  "2025": "2025年実績ベース",
  "2026": "2026年予測ベース",
} as const;

export function isBevPowertrain(pt: Powertrain): boolean {
  return pt === "BEV_SMALL" || pt === "BEV_NORMAL";
}
