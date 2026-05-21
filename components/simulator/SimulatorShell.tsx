"use client";

import { Toaster } from "@/components/ui/sonner";
import { AppHeader } from "@/components/layout/AppHeader";
import { ContextBar } from "@/components/layout/ContextBar";
import { PaneNav } from "@/components/layout/PaneNav";
import { ScopeAlerts } from "@/components/layout/ScopeAlerts";
import { Pane1Portfolio } from "@/components/panes/Pane1Portfolio";
import { Pane2Regulation } from "@/components/panes/Pane2Regulation";
import { Pane3Results } from "@/components/panes/Pane3Results";
import { Pane4Analyst } from "@/components/panes/Pane4Analyst";
import { SimulatorProvider } from "@/components/simulator/SimulatorProvider";
import { Card, CardContent } from "@/components/ui/card";

export function SimulatorShell() {
  return (
    <SimulatorProvider>
      <div className="mx-auto max-w-5xl flex-1 space-y-6 px-4 py-6">
        <AppHeader />
        <ScopeAlerts />
        <ContextBar />
        <PaneNav />

        <Card id="pane-1-card">
          <CardContent className="pt-6">
            <Pane1Portfolio />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Pane2Regulation />
          </CardContent>
        </Card>

        <Pane3Results />

        <Card>
          <CardContent className="pt-6">
            <Pane4Analyst />
          </CardContent>
        </Card>
      </div>
      <Toaster richColors position="top-center" />
    </SimulatorProvider>
  );
}
