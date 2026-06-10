"use client";

import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useSimulator } from "@/components/simulator/SimulatorProvider";
import { PaneSectionHeader } from "@/components/panes/PaneSectionHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PRESETS, REGULATION_YEARS, UI_WEIGHT_PREVIEW } from "@/lib/constants";
import { parseNonNegativeFloat } from "@/lib/parse";
import { getDisplayTargetCo2, getRegulationForYear } from "@/lib/selectors";
import type { PresetId, RegulationYear } from "@/lib/types";

export function Pane2Regulation() {
  const { state, actions } = useSimulator();
  const year = state.selectedYear;
  const reg = getRegulationForYear(state, year);
  const displayTarget = getDisplayTargetCo2(state);

  const applyPreset = (id: PresetId) => {
    const label = actions.applyPreset(id, year);
    toast.success(`${label}を適用しました`, {
      description: `${year}年のパラメータのみ更新しました`,
    });
  };

  return (
    <div>
      <PaneSectionHeader
        compact
        number={2}
        title="規制シナリオ"
        description="対象年・クレジット・罰金。プリセットは選択年のみ上書き"
        trailing={
          <Select
            value={String(year)}
            onValueChange={(v) =>
              actions.setSelectedYear(Number(v) as RegulationYear)
            }
          >
            <SelectTrigger className="w-full min-w-[88px]" aria-label="対象年">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGULATION_YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}年
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="space-y-6">
        <div>
          <h3 className="mb-3 text-sm font-semibold">対象年と年次目標</h3>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>対象年</TableHead>
                  <TableHead className="text-right">目標 CO₂（g/km）</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {REGULATION_YEARS.map((y) => (
                  <TableRow key={y}>
                    <TableCell className="font-medium">{y}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={0}
                        className="ml-auto w-28 text-right"
                        value={
                          state.regulationsByYear[y].targetGPerKm ?? ""
                        }
                        onChange={(e) =>
                          actions.updateYearRegulation(y, {
                            targetGPerKm: parseNonNegativeFloat(
                              e.target.value,
                            ),
                          })
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="mb-3 text-sm font-semibold">シナリオパラメータ（{year}年）</h3>
          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => applyPreset("commission")}
            >
              {PRESETS.commission.label}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => applyPreset("parliament")}
            >
              {PRESETS.parliament.label}
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="燃料クレジット緩和（g/km）"
              value={reg.fuelCreditGPerKm}
              onChange={(v) =>
                actions.updateYearRegulation(year, { fuelCreditGPerKm: v })
              }
            />
            <Field
              label="グリーン鉄クレジット（g/km）"
              value={reg.greenSteelCreditGPerKm}
              onChange={(v) =>
                actions.updateYearRegulation(year, {
                  greenSteelCreditGPerKm: v,
                })
              }
            />
            <Field
              label="小型EVスーパークレジット係数"
              value={reg.smallEvSuperCreditFactor}
              onChange={(v) =>
                actions.updateYearRegulation(year, {
                  smallEvSuperCreditFactor: v,
                })
              }
              step="0.1"
            />
            <Field
              label="超過1gあたり罰金（€）"
              value={reg.penaltyPerGPerKmEur}
              onChange={(v) =>
                actions.updateYearRegulation(year, { penaltyPerGPerKmEur: v })
              }
            />
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="mb-3 text-sm font-semibold">重量補正（プレビュー）</h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Pane 1 の表から算出する処理は次フェーズです。表示はサンプル固定値です。
          </p>
          <dl className="grid gap-4 sm:grid-cols-3">
            <Metric label="販売加重平均重量" value={`${UI_WEIGHT_PREVIEW.averageWeightKg} kg`} />
            <Metric
              label="補正後目標 CO₂"
              value={`${UI_WEIGHT_PREVIEW.adjustedTargetGPerKm} g/km`}
            />
            <Metric
              label="実効目標（表示）"
              value={
                displayTarget !== null
                  ? `${displayTarget} g/km`
                  : "—"
              }
            />
          </dl>
          <div className="mt-4 flex items-center gap-2">
            <Checkbox
              id="manual-target"
              checked={reg.useManualTarget}
              onCheckedChange={(checked) =>
                actions.updateYearRegulation(year, {
                  useManualTarget: checked === true,
                })
              }
            />
            <Label htmlFor="manual-target" className="text-sm font-normal">
              手入力で目標 CO₂ を上書き
            </Label>
          </div>
          <div className="mt-2">
            <Input
              type="number"
              min={0}
              disabled={!reg.useManualTarget}
              className="max-w-xs"
              placeholder="手入力目標 g/km"
              value={reg.manualTargetGPerKm ?? ""}
              onChange={(e) =>
                actions.updateYearRegulation(year, {
                  manualTargetGPerKm: parseNonNegativeFloat(e.target.value),
                })
              }
            />
          </div>
        </div>

        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ChevronDown className="size-4" />
            詳細設定（重量補正係数）
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="係数 a"
              value={state.weightCoefficients.a}
              onChange={(v) => {
                if (v !== null) actions.updateWeightCoefficients({ a: v });
              }}
              step="0.0001"
            />
            <Field
              label="基準重量 M₀（kg）"
              value={state.weightCoefficients.m0}
              onChange={(v) => {
                if (v !== null) actions.updateWeightCoefficients({ m0: v });
              }}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  step?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        min={0}
        step={step}
        value={value ?? ""}
        onChange={(e) => onChange(parseNonNegativeFloat(e.target.value))}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );
}
