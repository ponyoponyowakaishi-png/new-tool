"use client";

import { ChevronDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function ScopeAlerts() {
  return (
    <div className="grid gap-2 lg:grid-cols-2">
      <Alert className="py-2">
        <AlertTitle className="text-xs">社内専用・試算ツール</AlertTitle>
        <AlertDescription className="text-xs">
          公式申告の代替ではありません。社内検討用のたたき台としてご利用ください。
        </AlertDescription>
      </Alert>
      <Collapsible>
        <Alert variant="default" className="py-2 pb-2">
          <AlertTitle className="text-xs">v1 対象外</AlertTitle>
          <AlertDescription className="text-xs">
            プール・エコイノベは未対応。単一メーカーフリート前提です。
          </AlertDescription>
          <CollapsibleTrigger className="mt-2 flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
            <ChevronDown className="size-3.5" />
            補足を表示
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 text-xs text-muted-foreground">
            重量補正・年次ターゲット・燃料クレジット等は Pane 2 で設定できますが、Pane
            3 の数値は UI プレビュー用の固定サンプルです（計算接続は次フェーズ）。
          </CollapsibleContent>
        </Alert>
      </Collapsible>
    </div>
  );
}
