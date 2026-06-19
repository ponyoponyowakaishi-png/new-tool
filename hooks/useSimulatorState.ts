"use client";

import { useCallback, useMemo, useState } from "react";
import { MAX_VEHICLES, PRESETS } from "@/lib/constants";
import { createEmptyVehicle, createInitialState } from "@/lib/defaults";
import { isBevPowertrain } from "@/lib/sample-data";
import { portfolioKeyToBundleKey } from "@/lib/selectors";
import type {
  ActivePortfolioKey,
  PresetId,
  RegulationYear,
  SimulatorState,
  VehicleRow,
  WeightCoefficients,
  YearRegulation,
} from "@/lib/types";

function normalizeVehicle(row: VehicleRow): VehicleRow {
  if (isBevPowertrain(row.powertrain)) {
    return { ...row, wltpGPerKm: 0 };
  }
  return row;
}

function updatePortfolioRows(
  state: SimulatorState,
  updater: (rows: VehicleRow[]) => VehicleRow[],
): SimulatorState {
  const key = portfolioKeyToBundleKey(state.activePortfolio);
  return {
    ...state,
    portfolios: {
      ...state.portfolios,
      [key]: updater(state.portfolios[key]),
    },
  };
}

export function useSimulatorState() {
  const [state, setState] = useState<SimulatorState>(createInitialState);

  const setActivePortfolio = useCallback((key: ActivePortfolioKey) => {
    setState((s) => ({ ...s, activePortfolio: key }));
  }, []);

  const setSelectedYear = useCallback((year: RegulationYear) => {
    setState((s) => ({ ...s, selectedYear: year }));
  }, []);

  const updateVehicleRow = useCallback(
    (id: string, patch: Partial<VehicleRow>) => {
      setState((s) =>
        updatePortfolioRows(s, (rows) =>
          rows.map((row) =>
            row.id === id ? normalizeVehicle({ ...row, ...patch }) : row,
          ),
        ),
      );
    },
    [],
  );

  const addVehicleRow = useCallback(() => {
    setState((s) => {
      const key = portfolioKeyToBundleKey(s.activePortfolio);
      if (s.portfolios[key].length >= MAX_VEHICLES) return s;
      return updatePortfolioRows(s, (rows) => [
        ...rows,
        createEmptyVehicle(),
      ]);
    });
  }, []);

  const removeVehicleRow = useCallback((id: string) => {
    setState((s) =>
      updatePortfolioRows(s, (rows) => rows.filter((row) => row.id !== id)),
    );
  }, []);

  const updateYearRegulation = useCallback(
    (year: RegulationYear, patch: Partial<YearRegulation>) => {
      setState((s) => ({
        ...s,
        regulationsByYear: {
          ...s.regulationsByYear,
          [year]: { ...s.regulationsByYear[year], ...patch },
        },
      }));
    },
    [],
  );

  const updateWeightCoefficients = useCallback(
    (patch: Partial<WeightCoefficients>) => {
      setState((s) => ({
        ...s,
        weightCoefficients: { ...s.weightCoefficients, ...patch },
      }));
    },
    [],
  );

  const applyPreset = useCallback((presetId: PresetId, year: RegulationYear) => {
    const preset = PRESETS[presetId];
    setState((s) => ({
      ...s,
      regulationsByYear: {
        ...s.regulationsByYear,
        [year]: {
          ...s.regulationsByYear[year],
          ...preset.values,
        },
      },
    }));
    return preset.label;
  }, []);

  const replaceState = useCallback((next: SimulatorState) => {
    setState(next);
  }, []);

  const resetToDefaults = useCallback(() => {
    setState(createInitialState());
  }, []);

  const actions = useMemo(
    () => ({
      setActivePortfolio,
      setSelectedYear,
      updateVehicleRow,
      addVehicleRow,
      removeVehicleRow,
      updateYearRegulation,
      updateWeightCoefficients,
      applyPreset,
      replaceState,
      resetToDefaults,
    }),
    [
      setActivePortfolio,
      setSelectedYear,
      updateVehicleRow,
      addVehicleRow,
      removeVehicleRow,
      updateYearRegulation,
      updateWeightCoefficients,
      applyPreset,
      replaceState,
      resetToDefaults,
    ],
  );

  return { state, actions };
}

export type SimulatorActions = ReturnType<typeof useSimulatorState>["actions"];
