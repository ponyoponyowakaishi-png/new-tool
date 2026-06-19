"use client";

import { useCallback, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AppHeader } from "@/components/layout/AppHeader";
import { ContextBar } from "@/components/layout/ContextBar";
import { ScenarioBar } from "@/components/layout/ScenarioBar";
import { Pane4Rail } from "@/components/layout/Pane4Rail";
import { ScopeAlerts } from "@/components/layout/ScopeAlerts";
import { WorkspacePane } from "@/components/layout/WorkspacePane";
import { Pane1Portfolio } from "@/components/panes/Pane1Portfolio";
import { Pane2Regulation } from "@/components/panes/Pane2Regulation";
import { Pane3Results } from "@/components/panes/Pane3Results";
import { Pane4Analyst } from "@/components/panes/Pane4Analyst";
import { SimulatorProvider } from "@/components/simulator/SimulatorProvider";

export function SimulatorShell() {
  const [pane4Open, setPane4Open] = useState(false);

  const togglePane4 = useCallback(() => {
    setPane4Open((open) => !open);
  }, []);

  return (
    <SimulatorProvider>
      <div className="flex h-screen min-h-screen flex-col bg-background">
        <header className="shrink-0 space-y-3 border-b px-4 py-4">
          <AppHeader />
          <ScenarioBar />
          <ScopeAlerts />
          <ContextBar />
        </header>

        <div
          className="flex min-h-0 flex-1 overflow-hidden"
          role="region"
          aria-label={pane4Open ? "4ペインワークスペース" : "3ペインワークスペース"}
        >
          <WorkspacePane id="pane-1" layout="equal">
            <Pane1Portfolio />
          </WorkspacePane>
          <WorkspacePane id="pane-2" layout="equal">
            <Pane2Regulation />
          </WorkspacePane>
          <WorkspacePane
            id="pane-3"
            layout="equal"
            className={pane4Open ? undefined : "border-r-0"}
          >
            <Pane3Results />
          </WorkspacePane>

          {pane4Open ? (
            <WorkspacePane id="pane-4" layout="drawer">
              <Pane4Analyst />
            </WorkspacePane>
          ) : null}

          <Pane4Rail open={pane4Open} onToggle={togglePane4} />
        </div>
      </div>
      <Toaster richColors position="top-center" />
    </SimulatorProvider>
  );
}
