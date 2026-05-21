"use client";

import { useSimulator } from "@/components/simulator/SimulatorProvider";
import { Badge } from "@/components/ui/badge";
import { PORTFOLIO_LABELS } from "@/lib/sample-data";

export function ContextBar() {
  const { state } = useSimulator();

  return (
    <div
      className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-lg border bg-background/95 px-3 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80"
      aria-label="現在のシナリオ文脈"
    >
      <span className="text-xs font-medium text-muted-foreground">文脈</span>
      <Badge variant="outline">対象年: {state.selectedYear}</Badge>
      <Badge variant="outline">
        ポートフォリオ: {PORTFOLIO_LABELS[state.activePortfolio]}
      </Badge>
      <Badge className="border-amber-500/50 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        計算: デモ固定（入力未連動）
      </Badge>
    </div>
  );
}
