"use client";

import { Download, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const DISABLED_TOOLTIP = "JSON 入出力は v1 対象外です";

export function AppHeader() {
  return (
    <header className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              欧州CO₂規制シナリオ・シミュレーター
            </h1>
            <Badge variant="outline">サンプルデータ（架空数値）</Badge>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            販売ポートフォリオと規制シナリオを組み合わせ、フリートCO₂・達成率・罰金の試算と社内文案のたたき台を行う社内ツール（個人用試作）
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  aria-disabled
                  aria-describedby="export-tooltip"
                >
                  <Download className="size-4" />
                  エクスポート
                </Button>
              }
            />
            <TooltipContent id="export-tooltip">{DISABLED_TOOLTIP}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  aria-disabled
                >
                  <Upload className="size-4" />
                  インポート
                </Button>
              }
            />
            <TooltipContent>{DISABLED_TOOLTIP}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
