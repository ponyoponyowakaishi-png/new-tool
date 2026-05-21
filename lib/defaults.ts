import {
  DEFAULT_WEIGHT_COEFFICIENTS,
  INITIAL_YEAR_TARGETS,
  PRESETS,
} from "@/lib/constants";
import type {
  PortfolioBundle,
  RegulationYear,
  SimulatorState,
  VehicleRow,
  YearRegulation,
} from "@/lib/types";

function newVehicleId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `v-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createVehicle(
  partial: Omit<VehicleRow, "id"> & { id?: string },
): VehicleRow {
  return { id: partial.id ?? newVehicleId(), ...partial };
}

const SAMPLE_VEHICLES_2025: Omit<VehicleRow, "id">[] = [
  {
    name: "コンパクト（ICE/HEV）",
    powertrain: "ICE_HEV",
    salesCount: 12500,
    wltpGPerKm: 118,
    weightKg: 1420,
  },
  {
    name: "セダン（PHEV）",
    powertrain: "PHEV",
    salesCount: 8200,
    wltpGPerKm: 42,
    weightKg: 1680,
  },
  {
    name: "SUV（PHEV）",
    powertrain: "PHEV",
    salesCount: 6100,
    wltpGPerKm: 48,
    weightKg: 1920,
  },
  {
    name: "ハッチ（BEV・小型）",
    powertrain: "BEV_SMALL",
    salesCount: 4500,
    wltpGPerKm: 0,
    weightKg: 1280,
  },
  {
    name: "クロスオーバー（BEV）",
    powertrain: "BEV_NORMAL",
    salesCount: 11200,
    wltpGPerKm: 0,
    weightKg: 1850,
  },
  {
    name: "ミニバン（ICE/HEV）",
    powertrain: "ICE_HEV",
    salesCount: 6000,
    wltpGPerKm: 132,
    weightKg: 1780,
  },
];

const SAMPLE_VEHICLES_2026: Omit<VehicleRow, "id">[] = [
  {
    name: "コンパクト（ICE/HEV）",
    powertrain: "ICE_HEV",
    salesCount: 11800,
    wltpGPerKm: 115,
    weightKg: 1410,
  },
  {
    name: "セダン（PHEV）",
    powertrain: "PHEV",
    salesCount: 9000,
    wltpGPerKm: 40,
    weightKg: 1670,
  },
  {
    name: "SUV（PHEV）",
    powertrain: "PHEV",
    salesCount: 7200,
    wltpGPerKm: 46,
    weightKg: 1910,
  },
  {
    name: "ハッチ（BEV・小型）",
    powertrain: "BEV_SMALL",
    salesCount: 5800,
    wltpGPerKm: 0,
    weightKg: 1270,
  },
  {
    name: "クロスオーバー（BEV）",
    powertrain: "BEV_NORMAL",
    salesCount: 13500,
    wltpGPerKm: 0,
    weightKg: 1840,
  },
];

function createYearRegulation(year: RegulationYear): YearRegulation {
  const commission = PRESETS.commission.values;
  return {
    targetGPerKm: INITIAL_YEAR_TARGETS[year],
    fuelCreditGPerKm: commission.fuelCreditGPerKm,
    greenSteelCreditGPerKm: commission.greenSteelCreditGPerKm,
    smallEvSuperCreditFactor: commission.smallEvSuperCreditFactor,
    penaltyPerGPerKmEur: 95,
    useManualTarget: false,
    manualTargetGPerKm: null,
  };
}

export function createInitialPortfolios(): PortfolioBundle {
  return {
    base2025: SAMPLE_VEHICLES_2025.map((v) => createVehicle(v)),
    base2026: SAMPLE_VEHICLES_2026.map((v) => createVehicle(v)),
  };
}

export function createEmptyVehicle(): VehicleRow {
  return createVehicle({
    name: "",
    powertrain: "ICE_HEV",
    salesCount: null,
    wltpGPerKm: null,
    weightKg: null,
  });
}

export function createInitialState(): SimulatorState {
  return {
    portfolios: createInitialPortfolios(),
    regulationsByYear: {
      2025: createYearRegulation(2025),
      2027: createYearRegulation(2027),
      2030: createYearRegulation(2030),
    },
    weightCoefficients: { ...DEFAULT_WEIGHT_COEFFICIENTS },
    activePortfolio: "2025",
    selectedYear: 2027,
  };
}
