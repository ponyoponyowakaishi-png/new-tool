"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { PaneSectionHeader } from "@/components/panes/PaneSectionHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PANE3_STATIC_DEMO } from "@/lib/pane3-static-demo";
import { formatNumber } from "@/lib/parse";

const demo = PANE3_STATIC_DEMO;

export function Pane3Results() {
  return (
    <section
      id="pane-3"
      className="scroll-mt-24 rounded-xl border border-amber-500/40 border-l-4 border-l-amber-500 bg-card p-6 shadow-sm"
    >
      <PaneSectionHeader
        number={3}
        title="リアルタイム計算結果"
        description="フリート平均・達成率・罰金（Phase 2 で Pane 1・2 と接続予定）"
        badge="デモ表示（入力未連動）"
        badgeVariant="outline"
      />

      <Alert className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
        <AlertTitle>計算は次フェーズで接続します</AlertTitle>
        <AlertDescription>
          Pane 1・2 の変更は反映されません。表示はサンプル計算結果（参考値）です。
        </AlertDescription>
      </Alert>

      <div
        className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3 opacity-90"
        aria-live="polite"
      >
        {demo.isCompliant ? (
          <CheckCircle2 className="size-5 text-emerald-600" aria-hidden />
        ) : (
          <XCircle className="size-5 text-red-600" aria-hidden />
        )}
        <span
          className="font-medium"
          aria-label={demo.isCompliant ? "達成見込み" : "未達見込み"}
        >
          {demo.isCompliant ? "達成見込み" : "未達見込み"}
        </span>
        <Badge variant="outline" className="text-amber-800 dark:text-amber-200">
          参考値 · デモ
        </Badge>
      </div>

      <div className="mb-8 grid gap-4 opacity-60 sm:grid-cols-3">
        <HeroMetric
          label="規制達成率"
          value={
            demo.achievementRatePercent !== null
              ? `${formatNumber(demo.achievementRatePercent, 1)} %`
              : "—"
          }
          tone={demo.isCompliant ? "positive" : "negative"}
          sub="目標に対する比率（試算）"
        />
        <HeroMetric
          label="超過 / 猶予"
          value={`${demo.excessGPerKm > 0 ? "+" : ""}${formatNumber(demo.excessGPerKm, 1)} g/km`}
          tone={demo.excessGPerKm <= 0 ? "positive" : "negative"}
          sub={demo.excessGPerKm <= 0 ? "猶予あり" : "超過"}
        />
        <HeroMetric
          label="想定総罰金"
          value={`€ ${demo.totalPenaltyEur.toLocaleString("ja-JP")}`}
          tone="neutral"
          sub="試算・サンプル"
        />
      </div>

      <Collapsible>
        <CollapsibleTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground">
          詳細指標を表示
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 grid gap-3 sm:grid-cols-2">
          <SmallMetric
            label="フリート平均 CO₂"
            value={`${formatNumber(demo.fleetAverageGPerKm, 1)} g/km`}
          />
          <SmallMetric
            label="実質排出量"
            value={`${formatNumber(demo.effectiveEmissionsGPerKm, 1)} g/km`}
          />
          <SmallMetric
            label="目標 CO₂"
            value={`${formatNumber(demo.targetGPerKm, 1)} g/km`}
          />
          <SmallMetric
            label="総カウント台数"
            value={`${demo.totalCountedUnits.toLocaleString("ja-JP")} 台`}
          />
        </CollapsibleContent>
      </Collapsible>
    </section>
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
      <p className={`mt-2 text-3xl font-bold tabular-nums ${color}`}>{value}</p>
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
