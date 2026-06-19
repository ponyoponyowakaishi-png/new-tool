import type { PresetId, RegulationYear, YearRegulation } from "@/lib/types";

export const MAX_VEHICLES = 10;

export const REGULATION_YEARS: RegulationYear[] = [2025, 2027, 2030];

// OPEN: §13 — 年次初期 g/km の公式根拠
export const INITIAL_YEAR_TARGETS: Record<RegulationYear, number> = {
  2025: 95,
  2027: 90,
  2030: 85,
};

// OPEN: §13 — EU 重量補正式との突合
export const DEFAULT_WEIGHT_COEFFICIENTS = {
  a: 0.0333,
  m0: 1377,
} as const;

export const PRESETS: Record<
  PresetId,
  {
    label: string;
    values: Pick<
      YearRegulation,
      | "targetGPerKm"
      | "fuelCreditGPerKm"
      | "greenSteelCreditGPerKm"
      | "smallEvSuperCreditFactor"
    >;
  }
> = {
  commission: {
    label: "欧州委員会案",
    values: {
      targetGPerKm: 95,
      fuelCreditGPerKm: 0,
      greenSteelCreditGPerKm: 0,
      smallEvSuperCreditFactor: 1.0,
    },
  },
  parliament: {
    label: "欧州議会修正案（厳格化）",
    values: {
      targetGPerKm: 85,
      fuelCreditGPerKm: 1.5,
      greenSteelCreditGPerKm: 0.5,
      smallEvSuperCreditFactor: 1.3,
    },
  },
};
