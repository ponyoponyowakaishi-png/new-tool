import type { CalculationResult } from "@/lib/types";

/** UI-only: 固定サンプル（Pane1/2 の入力とは連動しない） */
export const PANE3_STATIC_DEMO: CalculationResult = {
  fleetAverageGPerKm: 102.8,
  effectiveEmissionsGPerKm: 102.3,
  targetGPerKm: 92.1,
  achievementRatePercent: 90.0,
  excessGPerKm: 10.2,
  totalPenaltyEur: 4_872_000,
  totalCountedUnits: 48_200,
  totalSalesUnits: 47_500,
  isCompliant: false,
};
