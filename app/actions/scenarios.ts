"use server";

import { randomUUID } from "crypto";
import { REGULATION_YEARS } from "@/lib/constants";
import {
  calculateFleetResult,
  normalizeAchievementRateForDb,
} from "@/lib/calculations";
import { sql } from "@/lib/db";
import {
  buildSimulatorStateFromRows,
  toDbPortfolioBaseYear,
  toInsertPortfolioRow,
  toInsertRegulationParam,
  toInsertWeightCoefficient,
  type PortfolioRowRecord,
  type RegulationParamRow,
  type ScenarioRow,
  type WeightCoefficientRow,
} from "@/lib/db-types";
import { getActivePortfolio } from "@/lib/selectors";
import type {
  CalculationResult,
  RegulationYear,
  SimulatorState,
} from "@/lib/types";

export type ScenarioSummary = {
  id: string;
  name: string;
  updated_at: string;
};

export type LoadedScenario = {
  id: string;
  name: string;
  state: SimulatorState;
};

type SqlQuery = ReturnType<typeof sql>;

function calculateResultForYear(
  state: SimulatorState,
  year: RegulationYear,
): CalculationResult {
  return calculateFleetResult({
    vehicles: getActivePortfolio(state),
    regulation: state.regulationsByYear[year],
    weightCoefficients: state.weightCoefficients,
    selectedYear: year,
  });
}

function buildChildInsertQueries(
  scenarioId: string,
  state: SimulatorState,
): SqlQuery[] {
  const queries: SqlQuery[] = [];

  const portfolioTables: Array<
    ["2025" | "2026", keyof SimulatorState["portfolios"]]
  > = [
    ["2025", "base2025"],
    ["2026", "base2026"],
  ];

  for (const [baseYear, key] of portfolioTables) {
    const rows = state.portfolios[key];
    for (let i = 0; i < rows.length; i++) {
      const payload = toInsertPortfolioRow(rows[i], scenarioId, baseYear, i);
      queries.push(sql`
        INSERT INTO portfolio_rows
          (scenario_id, base_year, sort_order, name, powertrain, sales_count, wltp_g_per_km, weight_kg)
        VALUES
          (${payload.scenario_id}, ${payload.base_year}, ${payload.sort_order},
           ${payload.name}, ${payload.powertrain}, ${payload.sales_count},
           ${payload.wltp_g_per_km}, ${payload.weight_kg})
      `);
    }
  }

  for (const year of REGULATION_YEARS) {
    const payload = toInsertRegulationParam(
      state.regulationsByYear[year],
      scenarioId,
      year,
    );
    queries.push(sql`
      INSERT INTO regulation_params
        (scenario_id, regulation_year, target_g_per_km, fuel_credit_g_per_km,
         green_steel_credit_g_per_km, small_ev_super_credit_factor, penalty_per_g_eur,
         use_manual_target, manual_target_g_per_km)
      VALUES
        (${payload.scenario_id}, ${payload.regulation_year}, ${payload.target_g_per_km},
         ${payload.fuel_credit_g_per_km}, ${payload.green_steel_credit_g_per_km},
         ${payload.small_ev_super_credit_factor}, ${payload.penalty_per_g_eur},
         ${payload.use_manual_target}, ${payload.manual_target_g_per_km})
    `);
  }

  const weight = toInsertWeightCoefficient(
    state.weightCoefficients,
    scenarioId,
  );
  queries.push(sql`
    INSERT INTO weight_coefficients (scenario_id, a, m0)
    VALUES (${weight.scenario_id}, ${weight.a}, ${weight.m0})
  `);

  for (const year of REGULATION_YEARS) {
    const result = calculateResultForYear(state, year);
    const achievement = normalizeAchievementRateForDb(
      result.achievementRatePercent,
    );
    queries.push(sql`
      INSERT INTO scenario_results
        (scenario_id, selected_year, fleet_avg_g_per_km, effective_emissions_g_per_km,
         target_g_per_km, achievement_rate_percent, excess_g_per_km, total_penalty_eur,
         total_counted_units, total_sales_units, is_compliant)
      VALUES
        (${scenarioId}, ${String(year)}, ${result.fleetAverageGPerKm},
         ${result.effectiveEmissionsGPerKm}, ${result.targetGPerKm}, ${achievement},
         ${result.excessGPerKm}, ${result.totalPenaltyEur},
         ${Math.round(result.totalCountedUnits)}, ${Math.round(result.totalSalesUnits)},
         ${result.isCompliant})
      ON CONFLICT (scenario_id, selected_year) DO UPDATE SET
        fleet_avg_g_per_km = EXCLUDED.fleet_avg_g_per_km,
        effective_emissions_g_per_km = EXCLUDED.effective_emissions_g_per_km,
        target_g_per_km = EXCLUDED.target_g_per_km,
        achievement_rate_percent = EXCLUDED.achievement_rate_percent,
        excess_g_per_km = EXCLUDED.excess_g_per_km,
        total_penalty_eur = EXCLUDED.total_penalty_eur,
        total_counted_units = EXCLUDED.total_counted_units,
        total_sales_units = EXCLUDED.total_sales_units,
        is_compliant = EXCLUDED.is_compliant,
        calculated_at = now()
    `);
  }

  return queries;
}

export async function listScenarios(): Promise<ScenarioSummary[]> {
  const rows = await sql`
    SELECT id, name, updated_at
    FROM scenarios
    ORDER BY updated_at DESC
  `;
  return rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    updated_at: new Date(row.updated_at as string).toISOString(),
  }));
}

export async function loadScenario(id: string): Promise<LoadedScenario> {
  const scenarios = await sql`
    SELECT id, name, description, active_portfolio, selected_year, created_at, updated_at
    FROM scenarios
    WHERE id = ${id}
  `;
  if (scenarios.length === 0) {
    throw new Error("シナリオが見つかりません。");
  }

  const scenario = scenarios[0] as ScenarioRow;
  const portfolioRows = (await sql`
    SELECT *
    FROM portfolio_rows
    WHERE scenario_id = ${id}
    ORDER BY base_year, sort_order
  `) as PortfolioRowRecord[];

  const regulationParams = (await sql`
    SELECT *
    FROM regulation_params
    WHERE scenario_id = ${id}
    ORDER BY regulation_year
  `) as RegulationParamRow[];

  const weightRows = (await sql`
    SELECT *
    FROM weight_coefficients
    WHERE scenario_id = ${id}
    LIMIT 1
  `) as WeightCoefficientRow[];

  return {
    id: scenario.id,
    name: scenario.name,
    state: buildSimulatorStateFromRows(
      scenario,
      portfolioRows,
      regulationParams,
      weightRows[0] ?? null,
    ),
  };
}

export async function saveScenario(
  scenarioId: string | null,
  name: string,
  state: SimulatorState,
  options?: { saveAs?: boolean },
): Promise<{ id: string; name: string }> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("シナリオ名を入力してください。");
  }

  const isUpdate = scenarioId !== null && !options?.saveAs;
  const id = isUpdate ? scenarioId! : randomUUID();
  const activePortfolio = toDbPortfolioBaseYear(state.activePortfolio);
  const selectedYear = String(state.selectedYear);

  const queries: SqlQuery[] = [];

  if (isUpdate) {
    queries.push(sql`
      UPDATE scenarios
      SET name = ${trimmedName},
          active_portfolio = ${activePortfolio},
          selected_year = ${selectedYear},
          updated_at = now()
      WHERE id = ${id}
    `);
    queries.push(sql`DELETE FROM portfolio_rows WHERE scenario_id = ${id}`);
    queries.push(sql`DELETE FROM regulation_params WHERE scenario_id = ${id}`);
    queries.push(sql`DELETE FROM weight_coefficients WHERE scenario_id = ${id}`);
  } else {
    queries.push(sql`
      INSERT INTO scenarios (id, name, active_portfolio, selected_year)
      VALUES (${id}, ${trimmedName}, ${activePortfolio}, ${selectedYear})
    `);
  }

  queries.push(...buildChildInsertQueries(id, state));

  try {
    await sql.transaction(queries);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "保存に失敗しました";
    throw new Error(`シナリオの保存に失敗しました: ${message}`);
  }

  return { id, name: trimmedName };
}

export async function deleteScenario(id: string): Promise<void> {
  const result = await sql`
    DELETE FROM scenarios WHERE id = ${id} RETURNING id
  `;
  if (result.length === 0) {
    throw new Error("シナリオが見つかりません。");
  }
}
