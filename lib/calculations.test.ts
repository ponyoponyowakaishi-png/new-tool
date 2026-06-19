import { describe, expect, it } from "vitest";
import { createInitialState } from "@/lib/defaults";
import {
  calculateFleetResult,
  calculateFromState,
  computeAdjustedTargetGPerKm,
  formatAchievementRatePercent,
  normalizeAchievementRateForDb,
  resolveTargetGPerKm,
} from "@/lib/calculations";
import { toCalculationInput } from "@/lib/selectors";
import type { CalculationInput, VehicleRow } from "@/lib/types";

function vehicle(
  partial: Omit<VehicleRow, "id"> & { id?: string },
): VehicleRow {
  return { id: partial.id ?? "test", ...partial };
}

describe("calculateFleetResult", () => {
  it("computes non-compliant fleet with penalty", () => {
    const input: CalculationInput = {
      selectedYear: 2027,
      weightCoefficients: { a: 0.0333, m0: 1377 },
      regulation: {
        targetGPerKm: 50,
        fuelCreditGPerKm: 0,
        greenSteelCreditGPerKm: 0,
        smallEvSuperCreditFactor: 1,
        penaltyPerGPerKmEur: 95,
        useManualTarget: true,
        manualTargetGPerKm: 50,
      },
      vehicles: [
        vehicle({
          name: "ICE",
          powertrain: "ICE_HEV",
          salesCount: 1000,
          wltpGPerKm: 120,
          weightKg: 1500,
        }),
      ],
    };

    const result = calculateFleetResult(input);
    expect(result.fleetAverageGPerKm).toBe(120);
    expect(result.effectiveEmissionsGPerKm).toBe(120);
    expect(result.targetGPerKm).toBe(50);
    expect(result.excessGPerKm).toBe(70);
    expect(result.isCompliant).toBe(false);
    expect(result.totalPenaltyEur).toBe(70 * 1000 * 95);
    expect(result.achievementRatePercent).toBeCloseTo((50 / 120) * 100, 5);
  });

  it("treats BEV emissions as zero even if WLTP is non-zero", () => {
    const input: CalculationInput = {
      selectedYear: 2027,
      weightCoefficients: { a: 0.0333, m0: 1377 },
      regulation: {
        targetGPerKm: 95,
        fuelCreditGPerKm: 0,
        greenSteelCreditGPerKm: 0,
        smallEvSuperCreditFactor: 1,
        penaltyPerGPerKmEur: 95,
        useManualTarget: false,
        manualTargetGPerKm: null,
      },
      vehicles: [
        vehicle({
          name: "BEV",
          powertrain: "BEV_NORMAL",
          salesCount: 1000,
          wltpGPerKm: 99,
          weightKg: 1800,
        }),
      ],
    };

    const result = calculateFleetResult(input);
    expect(result.fleetAverageGPerKm).toBe(0);
    expect(result.achievementRatePercent).toBe(Number.POSITIVE_INFINITY);
  });

  it("applies weight correction to the target", () => {
    const fleetAvgWeightKg = 1580;
    const adjusted = computeAdjustedTargetGPerKm(
      90,
      { a: 0.0333, m0: 1377 },
      fleetAvgWeightKg,
    );
    expect(adjusted).toBeCloseTo(90 + 0.0333 * (1580 - 1377), 3);

    const input: CalculationInput = {
      selectedYear: 2027,
      weightCoefficients: { a: 0.0333, m0: 1377 },
      regulation: {
        targetGPerKm: 90,
        fuelCreditGPerKm: 0,
        greenSteelCreditGPerKm: 0,
        smallEvSuperCreditFactor: 1,
        penaltyPerGPerKmEur: 95,
        useManualTarget: false,
        manualTargetGPerKm: null,
      },
      vehicles: [
        vehicle({
          name: "Heavy ICE",
          powertrain: "ICE_HEV",
          salesCount: 1000,
          wltpGPerKm: 100,
          weightKg: fleetAvgWeightKg,
        }),
      ],
    };

    expect(resolveTargetGPerKm(input)).toBeCloseTo(adjusted, 3);
  });

  it("uses super credit in counted units denominator", () => {
    const input: CalculationInput = {
      selectedYear: 2027,
      weightCoefficients: { a: 0, m0: 1377 },
      regulation: {
        targetGPerKm: 100,
        fuelCreditGPerKm: 0,
        greenSteelCreditGPerKm: 0,
        smallEvSuperCreditFactor: 2,
        penaltyPerGPerKmEur: 95,
        useManualTarget: true,
        manualTargetGPerKm: 100,
      },
      vehicles: [
        vehicle({
          name: "ICE",
          powertrain: "ICE_HEV",
          salesCount: 1000,
          wltpGPerKm: 100,
          weightKg: 1500,
        }),
        vehicle({
          name: "Small BEV",
          powertrain: "BEV_SMALL",
          salesCount: 1000,
          wltpGPerKm: 0,
          weightKg: 1200,
        }),
      ],
    };

    const result = calculateFleetResult(input);
    expect(result.totalCountedUnits).toBe(3000);
    expect(result.fleetAverageGPerKm).toBeCloseTo(100 / 3, 5);
  });

  it("formats and normalizes achievement rate edge cases", () => {
    expect(
      formatAchievementRatePercent(Number.POSITIVE_INFINITY, (n) =>
        n.toFixed(1),
      ),
    ).toBe("≥100%");
    expect(normalizeAchievementRateForDb(Number.POSITIVE_INFINITY)).toBeNull();
    expect(normalizeAchievementRateForDb(92.4)).toBe(92.4);
  });

  it("calculates initial sample state without throwing", () => {
    const result = calculateFromState(createInitialState());
    expect(result.totalSalesUnits).toBeGreaterThan(0);
    expect(result.targetGPerKm).toBeGreaterThan(0);
    expect(typeof result.isCompliant).toBe("boolean");
  });

  it("changes fleet average when fuel credit changes", () => {
    const base = createInitialState();
    const without = calculateFromState(base);
    const withCredit = calculateFromState({
      ...base,
      regulationsByYear: {
        ...base.regulationsByYear,
        [base.selectedYear]: {
          ...base.regulationsByYear[base.selectedYear],
          fuelCreditGPerKm: 25,
        },
      },
    });
    expect(withCredit.fleetAverageGPerKm).toBeLessThan(
      without.fleetAverageGPerKm,
    );
    expect(withCredit.totalPenaltyEur).toBe(without.totalPenaltyEur);
    expect(withCredit.isCompliant).toBe(without.isCompliant);
  });

  it("handles DB numeric fields returned as strings", () => {
    const state = createInitialState();
    state.regulationsByYear[2030].targetGPerKm = "85" as unknown as number;

    const result = calculateFromState(state);
    expect(typeof result.targetGPerKm).toBe("number");
    expect(String(result.targetGPerKm)).not.toContain("85.009");
    expect(result.targetGPerKm).toBeGreaterThan(90);
  });
});
