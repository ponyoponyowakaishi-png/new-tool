"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  useSimulatorState,
  type SimulatorActions,
} from "@/hooks/useSimulatorState";
import type { SimulatorState } from "@/lib/types";

interface SimulatorContextValue {
  state: SimulatorState;
  actions: SimulatorActions;
}

const SimulatorContext = createContext<SimulatorContextValue | null>(null);

export function SimulatorProvider({ children }: { children: ReactNode }) {
  const { state, actions } = useSimulatorState();
  return (
    <SimulatorContext.Provider value={{ state, actions }}>
      {children}
    </SimulatorContext.Provider>
  );
}

export function useSimulator(): SimulatorContextValue {
  const ctx = useContext(SimulatorContext);
  if (!ctx) {
    throw new Error("useSimulator must be used within SimulatorProvider");
  }
  return ctx;
}
