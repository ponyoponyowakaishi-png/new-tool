import { describe, expect, it } from "vitest";
import { createInitialState } from "@/lib/defaults";
import { MAX_VEHICLES } from "@/lib/constants";
import { PRESETS } from "@/lib/constants";
import type { RegulationYear, SimulatorState } from "@/lib/types";

function applyPresetOnState(
  state: SimulatorState,
  presetId: keyof typeof PRESETS,
  year: RegulationYear,
): SimulatorState {
  const preset = PRESETS[presetId];
  return {
    ...state,
    regulationsByYear: {
      ...state.regulationsByYear,
      [year]: { ...state.regulationsByYear[year], ...preset.values },
    },
  };
}

function addRowUntilCap(state: SimulatorState): SimulatorState {
  let s = state;
  const key = s.activePortfolio === "2025" ? "base2025" : "base2026";
  while (s.portfolios[key].length < MAX_VEHICLES) {
    s = {
      ...s,
      portfolios: {
        ...s.portfolios,
        [key]: [
          ...s.portfolios[key],
          {
            id: `extra-${s.portfolios[key].length}`,
            name: "",
            powertrain: "ICE_HEV",
            salesCount: null,
            wltpGPerKm: null,
            weightKg: null,
          },
        ],
      },
    };
  }
  return s;
}

describe("simulator state rules", () => {
  it("caps vehicles at MAX_VEHICLES", () => {
    const state = addRowUntilCap(createInitialState());
    const key = state.activePortfolio === "2025" ? "base2025" : "base2026";
    expect(state.portfolios[key]).toHaveLength(MAX_VEHICLES);
  });

  it("forces BEV WLTP to zero", () => {
    const state = createInitialState();
    const row = state.portfolios.base2025.find((r) => r.powertrain === "BEV_NORMAL");
    expect(row?.wltpGPerKm).toBe(0);
  });

  it("applyPreset updates only the selected year", () => {
    const state = createInitialState();
    const next = applyPresetOnState(state, "parliament", 2027);
    expect(next.regulationsByYear[2027].targetGPerKm).toBe(85);
    expect(next.regulationsByYear[2025].targetGPerKm).toBe(95);
    expect(next.regulationsByYear[2030].targetGPerKm).toBe(85);
  });
});
