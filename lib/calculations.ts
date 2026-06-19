import { isBevPowertrain } from "@/lib/sample-data";
import type {
  CalculationInput,
  CalculationResult,
  SimulatorState,
  VehicleRow,
  WeightCoefficients,
  YearRegulation,
} from "@/lib/types";
import { toCalculationInput } from "@/lib/selectors";

function safeNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isNaN(n) ? 0 : n;
}

function safeNullableNumber(
  value: number | string | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isNaN(n) ? null : n;
}

export function computeFleetAverageWeightKg(
  vehicles: VehicleRow[],
): number | null {
  let weightedSum = 0;
  let totalSales = 0;

  for (const vehicle of vehicles) {
    const sales = safeNumber(vehicle.salesCount);
    if (sales <= 0) continue;
    weightedSum += safeNumber(vehicle.weightKg) * sales;
    totalSales += sales;
  }

  if (totalSales === 0) return null;
  return weightedSum / totalSales;
}

export function computeAdjustedTargetGPerKm(
  baseTargetGPerKm: number | string,
  weightCoefficients: WeightCoefficients,
  fleetAvgWeightKg: number,
): number {
  const { a, m0 } = weightCoefficients;
  return safeNumber(baseTargetGPerKm) + safeNumber(a) * (fleetAvgWeightKg - safeNumber(m0));
}

export function resolveTargetGPerKm(input: CalculationInput): number | null {
  const { regulation, weightCoefficients, vehicles } = input;

  if (regulation.useManualTarget) {
    return safeNullableNumber(regulation.manualTargetGPerKm);
  }

  if (regulation.targetGPerKm === null) return null;

  const baseTarget = safeNullableNumber(regulation.targetGPerKm);
  if (baseTarget === null) return null;

  const fleetAvgWeightKg = computeFleetAverageWeightKg(vehicles);
  if (fleetAvgWeightKg === null) return baseTarget;

  return computeAdjustedTargetGPerKm(
    baseTarget,
    weightCoefficients,
    fleetAvgWeightKg,
  );
}

export interface WeightPreview {
  averageWeightKg: number | null;
  adjustedTargetGPerKm: number | null;
  effectiveTargetGPerKm: number | null;
}

export function computeWeightPreview(state: SimulatorState): WeightPreview {
  const input = toCalculationInput(state);
  const fleetAvgWeightKg = computeFleetAverageWeightKg(input.vehicles);
  const effectiveTargetGPerKm = resolveTargetGPerKm(input);

  let adjustedTargetGPerKm: number | null = null;
  if (
    fleetAvgWeightKg !== null &&
    input.regulation.targetGPerKm !== null &&
    !input.regulation.useManualTarget
  ) {
    adjustedTargetGPerKm = computeAdjustedTargetGPerKm(
      input.regulation.targetGPerKm,
      input.weightCoefficients,
      fleetAvgWeightKg,
    );
  }

  return {
    averageWeightKg: fleetAvgWeightKg,
    adjustedTargetGPerKm,
    effectiveTargetGPerKm,
  };
}

export function calculateFleetResult(
  input: CalculationInput,
): CalculationResult {
  const { vehicles, regulation } = input;
  const fuelCredit = safeNumber(regulation.fuelCreditGPerKm);
  const greenSteel = safeNumber(regulation.greenSteelCreditGPerKm);
  const superFactor = safeNumber(regulation.smallEvSuperCreditFactor) || 1;
  const penaltyRate = safeNumber(regulation.penaltyPerGPerKmEur);
  const targetGPerKm = resolveTargetGPerKm(input) ?? 0;

  let totalSalesUnits = 0;
  let totalCountedUnits = 0;
  let weightedEmissionsSum = 0;

  for (const vehicle of vehicles) {
    const sales = safeNumber(vehicle.salesCount);
    if (sales <= 0) continue;

    totalSalesUnits += sales;

    const countedUnits =
      vehicle.powertrain === "BEV_SMALL" ? sales * superFactor : sales;
    totalCountedUnits += countedUnits;

    const adjustedEmission = isBevPowertrain(vehicle.powertrain)
      ? 0
      : Math.max(0, safeNumber(vehicle.wltpGPerKm) - fuelCredit);

    weightedEmissionsSum += adjustedEmission * sales;
  }

  if (totalCountedUnits === 0) {
    return emptyResult(targetGPerKm);
  }

  const fleetAverageGPerKm = weightedEmissionsSum / totalCountedUnits;
  const effectiveEmissionsGPerKm = Math.max(
    0,
    fleetAverageGPerKm - greenSteel,
  );
  const achievementRatePercent = computeAchievementRatePercent(
    targetGPerKm,
    effectiveEmissionsGPerKm,
  );
  const excessGPerKm = effectiveEmissionsGPerKm - targetGPerKm;
  const totalPenaltyEur =
    Math.max(0, excessGPerKm) * totalSalesUnits * penaltyRate;

  return {
    fleetAverageGPerKm,
    effectiveEmissionsGPerKm,
    targetGPerKm,
    achievementRatePercent,
    excessGPerKm,
    totalPenaltyEur,
    totalCountedUnits,
    totalSalesUnits,
    isCompliant: excessGPerKm <= 0,
  };
}

function emptyResult(targetGPerKm: number): CalculationResult {
  return {
    fleetAverageGPerKm: 0,
    effectiveEmissionsGPerKm: 0,
    targetGPerKm,
    achievementRatePercent: null,
    excessGPerKm: 0,
    totalPenaltyEur: 0,
    totalCountedUnits: 0,
    totalSalesUnits: 0,
    isCompliant: true,
  };
}

function computeAchievementRatePercent(
  targetGPerKm: number,
  effectiveEmissionsGPerKm: number,
): number | null {
  if (effectiveEmissionsGPerKm === 0) {
    return Number.POSITIVE_INFINITY;
  }
  return (targetGPerKm / effectiveEmissionsGPerKm) * 100;
}

export function calculateFromState(state: SimulatorState): CalculationResult {
  return calculateFleetResult(toCalculationInput(state));
}

/** 画面表示用。Infinity は「≥100%」に変換する */
export function formatAchievementRatePercent(
  rate: number | null,
  formatNumber: (value: number, digits?: number) => string,
): string {
  if (rate === null) return "—";
  if (!Number.isFinite(rate)) return "≥100%";
  return `${formatNumber(rate, 1)} %`;
}

/** DB 保存用。Infinity は null に変換する */
export function normalizeAchievementRateForDb(
  rate: number | null,
): number | null {
  if (rate === null || !Number.isFinite(rate)) return null;
  return rate;
}

export function isRegulationComplete(regulation: YearRegulation): boolean {
  return (
    regulation.targetGPerKm !== null &&
    regulation.fuelCreditGPerKm !== null &&
    regulation.greenSteelCreditGPerKm !== null &&
    regulation.smallEvSuperCreditFactor !== null &&
    regulation.penaltyPerGPerKmEur !== null &&
    (!regulation.useManualTarget || regulation.manualTargetGPerKm !== null)
  );
}
