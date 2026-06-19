"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useSimulator } from "@/components/simulator/SimulatorProvider";
import { PaneSectionHeader } from "@/components/panes/PaneSectionHeader";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  calculateFromState,
  formatAchievementRatePercent,
} from "@/lib/calculations";
import { formatNumber } from "@/lib/parse";

export function Pane3Results() {
  const { state } = useSimulator();
  const result = calculateFromState(state);

  return (
    <div>
      <PaneSectionHeader
        compact
        number={3}
        title="計算結果"
        description="Pane 1・2 の入力に連動してリアルタイム試算"
      />

      <div
        className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3"
        aria-live="off"
      >
        {result.isCompliant ? (
          <CheckCircle2 className="size-5 text-emerald-600" aria-hidden />
        ) : (
          <XCircle className="size-5 text-red-600" aria-hidden />
        )}
        <span
          className="font-medium"
          aria-label={result.isCompliant ? "達成見込み" : "未達見込み"}
        >
          {result.isCompliant ? "達成見込み" : "未達見込み"}
        </span>
      </div>

      <div className="mb-4 grid gap-3">
        <HeroMetric
          label="規制達成率"
          value={formatAchievementRatePercent(
            result.achievementRatePercent,
            formatNumber,
          )}
          tone={result.isCompliant ? "positive" : "negative"}
          sub="目標に対する比率（試算）"
        />
        <HeroMetric
          label="超過 / 猶予"
          value={`${result.excessGPerKm > 0 ? "+" : ""}${formatNumber(result.excessGPerKm, 1)} g/km`}
          tone={result.excessGPerKm <= 0 ? "positive" : "negative"}
          sub={result.excessGPerKm <= 0 ? "猶予あり" : "超過"}
        />
        <HeroMetric
          label="想定総罰金"
          value={`€ ${Math.round(result.totalPenaltyEur).toLocaleString("ja-JP")}`}
          tone="neutral"
          sub="試算"
        />
      </div>

      <Collapsible>
        <CollapsibleTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground">
          詳細指標を表示
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 grid gap-3 sm:grid-cols-2">
          <SmallMetric
            label="フリート平均 CO₂"
            value={`${formatNumber(result.fleetAverageGPerKm, 1)} g/km`}
          />
          <SmallMetric
            label="実質排出量"
            value={`${formatNumber(result.effectiveEmissionsGPerKm, 1)} g/km`}
          />
          <SmallMetric
            label="目標 CO₂"
            value={`${formatNumber(result.targetGPerKm, 1)} g/km`}
          />
          <SmallMetric
            label="総カウント台数"
            value={`${Math.round(result.totalCountedUnits).toLocaleString("ja-JP")} 台`}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function HeroMetric({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "positive" | "negative" | "neutral";
}) {
  const color =
    tone === "positive"
      ? "text-emerald-600"
      : tone === "negative"
        ? "text-red-600"
        : "text-foreground";

  return (
    <div className="rounded-xl border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
