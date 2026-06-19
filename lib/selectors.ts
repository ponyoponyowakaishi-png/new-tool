import { resolveTargetGPerKm } from "@/lib/calculations";
import type {
  ActivePortfolioKey,
  CalculationInput,
  RegulationYear,
  SimulatorState,
  VehicleRow,
  YearRegulation,
} from "@/lib/types";

export function getActivePortfolio(
  state: SimulatorState,
): VehicleRow[] {
  return state.portfolios[
    state.activePortfolio === "2025" ? "base2025" : "base2026"
  ];
}

export function getRegulationForYear(
  state: SimulatorState,
  year: RegulationYear,
): YearRegulation {
  return state.regulationsByYear[year];
}

export function getTotalSalesUnits(vehicles: VehicleRow[]): number {
  return vehicles.reduce((sum, v) => sum + (v.salesCount ?? 0), 0);
}

export function toCalculationInput(state: SimulatorState): CalculationInput {
  return {
    vehicles: getActivePortfolio(state),
    regulation: getRegulationForYear(state, state.selectedYear),
    weightCoefficients: state.weightCoefficients,
    selectedYear: state.selectedYear,
  };
}

export function getDisplayTargetCo2(state: SimulatorState): number | null {
  return resolveTargetGPerKm(toCalculationInput(state));
}

export function portfolioKeyToBundleKey(
  key: ActivePortfolioKey,
): "base2025" | "base2026" {
  return key === "2025" ? "base2025" : "base2026";
}
