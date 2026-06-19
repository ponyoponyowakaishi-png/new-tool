export type Powertrain = "ICE_HEV" | "PHEV" | "BEV_SMALL" | "BEV_NORMAL";

export type RegulationYear = 2025 | 2027 | 2030;

export type ActivePortfolioKey = "2025" | "2026";

export type PresetId = "commission" | "parliament";

export interface VehicleRow {
  id: string;
  name: string;
  powertrain: Powertrain;
  salesCount: number | null;
  wltpGPerKm: number | null;
  weightKg: number | null;
}

export interface PortfolioBundle {
  base2025: VehicleRow[];
  base2026: VehicleRow[];
}

export interface YearRegulation {
  targetGPerKm: number | null;
  fuelCreditGPerKm: number | null;
  greenSteelCreditGPerKm: number | null;
  smallEvSuperCreditFactor: number | null;
  penaltyPerGPerKmEur: number | null;
  useManualTarget: boolean;
  manualTargetGPerKm: number | null;
}

export interface WeightCoefficients {
  a: number;
  m0: number;
}

export interface SimulatorState {
  portfolios: PortfolioBundle;
  regulationsByYear: Record<RegulationYear, YearRegulation>;
  weightCoefficients: WeightCoefficients;
  activePortfolio: ActivePortfolioKey;
  selectedYear: RegulationYear;
}

export interface CalculationInput {
  vehicles: VehicleRow[];
  regulation: YearRegulation;
  weightCoefficients: WeightCoefficients;
  selectedYear: RegulationYear;
}

export interface CalculationResult {
  fleetAverageGPerKm: number;
  effectiveEmissionsGPerKm: number;
  targetGPerKm: number;
  achievementRatePercent: number | null;
  excessGPerKm: number;
  totalPenaltyEur: number;
  totalCountedUnits: number;
  totalSalesUnits: number;
  isCompliant: boolean;
}

export interface AnalystRequestPayload {
  input: CalculationInput;
  result: CalculationResult;
  portfolioLabel: string;
}
