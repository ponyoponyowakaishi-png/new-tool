/**
 * DB行型（lib/db-types.ts）
 *
 * PostgreSQL の各テーブル1行を表す TypeScript の型定義。
 * 命名規則: テーブル名を PascalCase にしたものに Row サフィックスをつける。
 *
 * 用途:
 *   - DB クエリ結果を受け取る変数の型注釈
 *   - INSERT / UPDATE 時のペイロード型（Insert〜Row）
 *   - lib/types.ts のドメイン型との変換関数（末尾に定義）
 *
 * ドメイン型との対応:
 *   ScenarioRow          ←→ SimulatorState（の activePortfolio / selectedYear）
 *   PortfolioRowRecord   ←→ VehicleRow
 *   RegulationParamRow   ←→ YearRegulation
 *   WeightCoefficientRow ←→ WeightCoefficients
 *   ScenarioResultRow    ←→ CalculationResult
 *   AiAnalysisRow        ←→ Pane4 の markdown_text
 */

// ---------------------------------------------------------------------------
// ENUM 型（PostgreSQL の ENUM と対応）
// ---------------------------------------------------------------------------

/** 車の動力方式（DB: powertrain ENUM） */
export type DbPowertrain = "ICE_HEV" | "PHEV" | "BEV_SMALL" | "BEV_NORMAL";

/** ポートフォリオの基準年（DB: portfolio_base_year ENUM） */
export type DbPortfolioBaseYear = "2025" | "2026";

/** 規制の対象年（DB: regulation_year ENUM） */
export type DbRegulationYear = "2025" | "2027" | "2030";

// ---------------------------------------------------------------------------
// テーブル行型 — SELECT で返ってくる全カラムの型
// ---------------------------------------------------------------------------

/** scenarios テーブルの1行 */
export interface ScenarioRow {
  id: string;                          // UUID
  name: string;
  description: string | null;
  active_portfolio: DbPortfolioBaseYear;
  selected_year: DbRegulationYear;
  created_at: Date;
  updated_at: Date;
}

/**
 * portfolio_rows テーブルの1行
 * 名前が VehicleRow と被るため Record サフィックスをつける
 */
export interface PortfolioRowRecord {
  id: string;                          // UUID
  scenario_id: string;                 // FK → scenarios.id
  base_year: DbPortfolioBaseYear;
  sort_order: number;
  name: string;
  powertrain: DbPowertrain;
  sales_count: number | null;
  wltp_g_per_km: number | null;
  weight_kg: number | null;
}

/** regulation_params テーブルの1行 */
export interface RegulationParamRow {
  id: string;                          // UUID
  scenario_id: string;                 // FK → scenarios.id
  regulation_year: DbRegulationYear;
  target_g_per_km: number | null;
  fuel_credit_g_per_km: number;
  green_steel_credit_g_per_km: number;
  small_ev_super_credit_factor: number;
  penalty_per_g_eur: number;
  use_manual_target: boolean;
  manual_target_g_per_km: number | null;
}

/** weight_coefficients テーブルの1行 */
export interface WeightCoefficientRow {
  id: string;                          // UUID
  scenario_id: string;                 // FK → scenarios.id
  a: number;
  m0: number;
}

/** scenario_results テーブルの1行（Phase 2 で INSERT される） */
export interface ScenarioResultRow {
  id: string;                          // UUID
  scenario_id: string;                 // FK → scenarios.id
  selected_year: DbRegulationYear;
  fleet_avg_g_per_km: number;
  effective_emissions_g_per_km: number;
  target_g_per_km: number;
  achievement_rate_percent: number | null;
  excess_g_per_km: number;
  total_penalty_eur: number;
  total_counted_units: number;
  total_sales_units: number;
  is_compliant: boolean;
  calculated_at: Date;
}

/** ai_analyses テーブルの1行（Phase 2 で INSERT される） */
export interface AiAnalysisRow {
  id: string;                          // UUID
  scenario_id: string;                 // FK → scenarios.id
  selected_year: DbRegulationYear;
  markdown_text: string;
  created_at: Date;
}

// ---------------------------------------------------------------------------
// INSERT ペイロード型（id / created_at / updated_at を除いたもの）
// ---------------------------------------------------------------------------

export type InsertScenario = Omit<ScenarioRow, "id" | "created_at" | "updated_at">;
export type InsertPortfolioRow = Omit<PortfolioRowRecord, "id">;
export type InsertRegulationParam = Omit<RegulationParamRow, "id">;
export type InsertWeightCoefficient = Omit<WeightCoefficientRow, "id">;
export type InsertScenarioResult = Omit<ScenarioResultRow, "id" | "calculated_at">;
export type InsertAiAnalysis = Omit<AiAnalysisRow, "id" | "created_at">;

// ---------------------------------------------------------------------------
// ドメイン型 ←→ DB行型 変換ヘルパー
// ---------------------------------------------------------------------------

/** PostgreSQL の NUMERIC は Neon 経由で文字列になることがある */
function toNullableNumber(
  value: number | string | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isNaN(n) ? null : n;
}

function toNumber(value: number | string | null | undefined, fallback = 0): number {
  return toNullableNumber(value) ?? fallback;
}
import type {
  VehicleRow,
  YearRegulation,
  WeightCoefficients,
  CalculationResult,
  RegulationYear,
  ActivePortfolioKey,
  SimulatorState,
} from "@/lib/types";
import { REGULATION_YEARS } from "@/lib/constants";

/**
 * VehicleRow（ドメイン）→ InsertPortfolioRow（DB）
 *
 * @param row       - ドメイン型の車種行
 * @param scenarioId - 保存先シナリオの UUID
 * @param baseYear   - どちらの表か（"2025" or "2026"）
 * @param sortOrder  - 表示順（0始まり）
 */
export function toInsertPortfolioRow(
  row: VehicleRow,
  scenarioId: string,
  baseYear: DbPortfolioBaseYear,
  sortOrder: number,
): InsertPortfolioRow {
  return {
    scenario_id: scenarioId,
    base_year: baseYear,
    sort_order: sortOrder,
    name: row.name,
    powertrain: row.powertrain,
    sales_count: row.salesCount,
    wltp_g_per_km: row.wltpGPerKm,
    weight_kg: row.weightKg,
  };
}

/**
 * PortfolioRowRecord（DB）→ VehicleRow（ドメイン）
 */
export function toVehicleRow(record: PortfolioRowRecord): VehicleRow {
  return {
    id: record.id,
    name: record.name,
    powertrain: record.powertrain,
    salesCount: toNullableNumber(record.sales_count),
    wltpGPerKm: toNullableNumber(record.wltp_g_per_km),
    weightKg: toNullableNumber(record.weight_kg),
  };
}

/**
 * YearRegulation（ドメイン）→ InsertRegulationParam（DB）
 *
 * @param reg        - ドメイン型の規制パラメータ
 * @param scenarioId - 保存先シナリオの UUID
 * @param year       - 規制対象年
 */
export function toInsertRegulationParam(
  reg: YearRegulation,
  scenarioId: string,
  year: RegulationYear,
): InsertRegulationParam {
  return {
    scenario_id: scenarioId,
    regulation_year: String(year) as DbRegulationYear,
    target_g_per_km: reg.targetGPerKm,
    fuel_credit_g_per_km: reg.fuelCreditGPerKm ?? 0,
    green_steel_credit_g_per_km: reg.greenSteelCreditGPerKm ?? 0,
    small_ev_super_credit_factor: reg.smallEvSuperCreditFactor ?? 1.0,
    penalty_per_g_eur: reg.penaltyPerGPerKmEur ?? 95,
    use_manual_target: reg.useManualTarget,
    manual_target_g_per_km: reg.manualTargetGPerKm,
  };
}

/**
 * RegulationParamRow（DB）→ YearRegulation（ドメイン）
 */
export function toYearRegulation(row: RegulationParamRow): YearRegulation {
  return {
    targetGPerKm: toNullableNumber(row.target_g_per_km),
    fuelCreditGPerKm: toNullableNumber(row.fuel_credit_g_per_km),
    greenSteelCreditGPerKm: toNullableNumber(row.green_steel_credit_g_per_km),
    smallEvSuperCreditFactor: toNullableNumber(row.small_ev_super_credit_factor),
    penaltyPerGPerKmEur: toNullableNumber(row.penalty_per_g_eur),
    useManualTarget: row.use_manual_target,
    manualTargetGPerKm: toNullableNumber(row.manual_target_g_per_km),
  };
}

/**
 * WeightCoefficients（ドメイン）→ InsertWeightCoefficient（DB）
 */
export function toInsertWeightCoefficient(
  coeff: WeightCoefficients,
  scenarioId: string,
): InsertWeightCoefficient {
  return {
    scenario_id: scenarioId,
    a: coeff.a,
    m0: coeff.m0,
  };
}

/**
 * WeightCoefficientRow（DB）→ WeightCoefficients（ドメイン）
 */
export function toWeightCoefficients(row: WeightCoefficientRow): WeightCoefficients {
  return { a: toNumber(row.a), m0: toNumber(row.m0) };
}

/**
 * CalculationResult（ドメイン）→ InsertScenarioResult（DB）
 */
export function toInsertScenarioResult(
  result: CalculationResult,
  scenarioId: string,
  selectedYear: RegulationYear,
): InsertScenarioResult {
  return {
    scenario_id: scenarioId,
    selected_year: String(selectedYear) as DbRegulationYear,
    fleet_avg_g_per_km: result.fleetAverageGPerKm,
    effective_emissions_g_per_km: result.effectiveEmissionsGPerKm,
    target_g_per_km: result.targetGPerKm,
    achievement_rate_percent: result.achievementRatePercent,
    excess_g_per_km: result.excessGPerKm,
    total_penalty_eur: result.totalPenaltyEur,
    total_counted_units: result.totalCountedUnits,
    total_sales_units: result.totalSalesUnits,
    is_compliant: result.isCompliant,
  };
}

/**
 * ScenarioResultRow（DB）→ CalculationResult（ドメイン）
 */
export function toCalculationResult(row: ScenarioResultRow): CalculationResult {
  return {
    fleetAverageGPerKm: row.fleet_avg_g_per_km,
    effectiveEmissionsGPerKm: row.effective_emissions_g_per_km,
    targetGPerKm: row.target_g_per_km,
    achievementRatePercent: row.achievement_rate_percent,
    excessGPerKm: row.excess_g_per_km,
    totalPenaltyEur: row.total_penalty_eur,
    totalCountedUnits: row.total_counted_units,
    totalSalesUnits: row.total_sales_units,
    isCompliant: row.is_compliant,
  };
}

/**
 * ActivePortfolioKey（ドメイン）→ DbPortfolioBaseYear（DB）
 * 現状は同じ文字列だが、型の橋渡しとして明示する
 */
export function toDbPortfolioBaseYear(key: ActivePortfolioKey): DbPortfolioBaseYear {
  return key as DbPortfolioBaseYear;
}

/**
 * DB 行群から SimulatorState を復元する
 */
export function buildSimulatorStateFromRows(
  scenario: ScenarioRow,
  portfolioRows: PortfolioRowRecord[],
  regulationParams: RegulationParamRow[],
  weightCoeff: WeightCoefficientRow | null,
): SimulatorState {
  const sortRows = (baseYear: DbPortfolioBaseYear) =>
    portfolioRows
      .filter((row) => row.base_year === baseYear)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(toVehicleRow);

  const regulationsByYear = REGULATION_YEARS.reduce(
    (acc, year) => {
      const row = regulationParams.find(
        (param) => param.regulation_year === String(year),
      );
      acc[year] = row
        ? toYearRegulation(row)
        : {
            targetGPerKm: null,
            fuelCreditGPerKm: null,
            greenSteelCreditGPerKm: null,
            smallEvSuperCreditFactor: null,
            penaltyPerGPerKmEur: null,
            useManualTarget: false,
            manualTargetGPerKm: null,
          };
      return acc;
    },
    {} as SimulatorState["regulationsByYear"],
  );

  return {
    portfolios: {
      base2025: sortRows("2025"),
      base2026: sortRows("2026"),
    },
    regulationsByYear,
    weightCoefficients: weightCoeff
      ? toWeightCoefficients(weightCoeff)
      : { a: 0.0333, m0: 1377 },
    activePortfolio: scenario.active_portfolio as ActivePortfolioKey,
    selectedYear: Number(scenario.selected_year) as RegulationYear,
  };
}
