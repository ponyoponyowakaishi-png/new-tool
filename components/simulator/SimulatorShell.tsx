"use client";

import { Toaster } from "@/components/ui/sonner";
import { AppHeader } from "@/components/layout/AppHeader";
import { ContextBar } from "@/components/layout/ContextBar";
import { ScopeAlerts } from "@/components/layout/ScopeAlerts";
import { WorkspacePane } from "@/components/layout/WorkspacePane";
import { Pane1Portfolio } from "@/components/panes/Pane1Portfolio";
import { Pane2Regulation } from "@/components/panes/Pane2Regulation";
import { Pane3Results } from "@/components/panes/Pane3Results";
import { Pane4Analyst } from "@/components/panes/Pane4Analyst";
import { SimulatorProvider } from "@/components/simulator/SimulatorProvider";

export function SimulatorShell() {
  return (
    <SimulatorProvider>
      <div className="flex h-screen min-h-screen flex-col bg-background">
        <header className="shrink-0 space-y-3 border-b px-4 py-4">
          <AppHeader />
          <ScopeAlerts />
          <ContextBar />
        </header>

        <div
          className="flex min-h-0 flex-1 overflow-hidden"
          role="region"
          aria-label="4ペインワークスペース"
        >
          <WorkspacePane id="pane-1">
            <Pane1Portfolio />
          </WorkspacePane>
          <WorkspacePane id="pane-2">
            <Pane2Regulation />
          </WorkspacePane>
          <WorkspacePane id="pane-3" variant="demo">
            <Pane3Results />
          </WorkspacePane>
          <WorkspacePane id="pane-4">
            <Pane4Analyst />
          </WorkspacePane>
        </div>
      </div>
      <Toaster richColors position="top-center" />
    </SimulatorProvider>
  );
}
