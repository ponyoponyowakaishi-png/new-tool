"use client";

import { Plus, Trash2 } from "lucide-react";
import { useSimulator } from "@/components/simulator/SimulatorProvider";
import { PaneSectionHeader } from "@/components/panes/PaneSectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MAX_VEHICLES } from "@/lib/constants";
import { parseNonNegativeFloat, parseNonNegativeInt } from "@/lib/parse";
import {
  isBevPowertrain,
  PORTFOLIO_LABELS,
  POWERTRAIN_LABELS,
} from "@/lib/sample-data";
import {
  getActivePortfolio,
  getTotalSalesUnits,
} from "@/lib/selectors";
import type { ActivePortfolioKey, Powertrain } from "@/lib/types";

const PT_BADGE: Record<Powertrain, "default" | "secondary" | "outline"> = {
  ICE_HEV: "secondary",
  PHEV: "outline",
  BEV_SMALL: "default",
  BEV_NORMAL: "default",
};

export function Pane1Portfolio() {
  const { state, actions } = useSimulator();
  const rows = getActivePortfolio(state);
  const remaining = MAX_VEHICLES - rows.length;
  const totalUnits = getTotalSalesUnits(rows);

  return (
    <section id="pane-1" className="scroll-mt-24">
      <PaneSectionHeader
        number={1}
        title="販売ポートフォリオ設定"
        description="販売台数・WLTP・車両重量からフリート構成を定義します（2つのベース表を別々に保持）"
        badge="サンプル"
        trailing={
          <Select
            value={state.activePortfolio}
            onValueChange={(v) =>
              actions.setActivePortfolio(v as ActivePortfolioKey)
            }
          >
            <SelectTrigger className="w-[220px]" aria-label="販売データのベース">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">{PORTFOLIO_LABELS["2025"]}</SelectItem>
              <SelectItem value="2026">{PORTFOLIO_LABELS["2026"]}</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>車種名</TableHead>
              <TableHead>パワートレイン</TableHead>
              <TableHead className="text-right">販売台数（台）</TableHead>
              <TableHead className="text-right">WLTP（g/km）</TableHead>
              <TableHead className="text-right">重量（kg）</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const bev = isBevPowertrain(row.powertrain);
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <Input
                      value={row.name}
                      onChange={(e) =>
                        actions.updateVehicleRow(row.id, {
                          name: e.target.value,
                        })
                      }
                      placeholder="車種名"
                      className="min-w-[140px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={row.powertrain}
                      onValueChange={(v) =>
                        actions.updateVehicleRow(row.id, {
                          powertrain: v as Powertrain,
                        })
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(POWERTRAIN_LABELS) as Powertrain[]).map(
                          (pt) => (
                            <SelectItem key={pt} value={pt}>
                              <Badge variant={PT_BADGE[pt]} className="font-normal">
                                {POWERTRAIN_LABELS[pt]}
                              </Badge>
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      min={0}
                      className="ml-auto w-24 text-right"
                      value={row.salesCount ?? ""}
                      onChange={(e) =>
                        actions.updateVehicleRow(row.id, {
                          salesCount: parseNonNegativeInt(e.target.value),
                        })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Input
                            type="number"
                            min={0}
                            disabled={bev}
                            className="ml-auto w-24 text-right"
                            value={bev ? 0 : (row.wltpGPerKm ?? "")}
                            onChange={(e) =>
                              actions.updateVehicleRow(row.id, {
                                wltpGPerKm: parseNonNegativeFloat(
                                  e.target.value,
                                ),
                              })
                            }
                          />
                        }
                      />
                      {bev ? (
                        <TooltipContent>BEV系は WLTP 0 固定</TooltipContent>
                      ) : null}
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      min={0}
                      className="ml-auto w-24 text-right"
                      value={row.weightKg ?? ""}
                      onChange={(e) =>
                        actions.updateVehicleRow(row.id, {
                          weightKg: parseNonNegativeFloat(e.target.value),
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => actions.removeVehicleRow(row.id)}
                      aria-label="行を削除"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} className="font-medium">
                合計販売台数（実台数）
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {totalUnits.toLocaleString("ja-JP")} 台
              </TableCell>
              <TableCell colSpan={3} />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={remaining <= 0}
          onClick={() => actions.addVehicleRow()}
        >
          <Plus className="size-4" />
          車種を追加
          {remaining > 0 ? `（残り ${remaining} 枠）` : "（上限）"}
        </Button>
        <p className="text-xs text-muted-foreground">最大 {MAX_VEHICLES} 車種</p>
      </div>
    </section>
  );
}
