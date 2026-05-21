"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { PaneSectionHeader } from "@/components/panes/PaneSectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { PANE4_MOCK_MARKDOWN } from "@/lib/pane4-mock-response";

function renderMarkdownLines(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) {
      return (
        <h3 key={i} className="mt-4 mb-2 text-base font-semibold">
          {line.slice(3)}
        </h3>
      );
    }
    if (line.startsWith("### ")) {
      return (
        <h4 key={i} className="mt-3 mb-1 text-sm font-semibold">
          {line.slice(4)}
        </h4>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <li key={i} className="ml-4 list-disc text-sm">
          {line.slice(2)}
        </li>
      );
    }
    if (line.startsWith("---")) {
      return <hr key={i} className="my-4 border-border" />;
    }
    if (line.trim() === "") {
      return <br key={i} />;
    }
    if (line.startsWith("*") && line.endsWith("*")) {
      return (
        <p key={i} className="text-xs text-muted-foreground italic">
          {line.replace(/\*/g, "")}
        </p>
      );
    }
    return (
      <p key={i} className="text-sm leading-relaxed">
        {line}
      </p>
    );
  });
}

export function Pane4Analyst() {
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);

  const runAnalysis = () => {
    setLoading(true);
    setShown(false);
    window.setTimeout(() => {
      setLoading(false);
      setShown(true);
    }, 1800);
  };

  return (
    <section id="pane-4" className="scroll-mt-24">
      <PaneSectionHeader
        number={4}
        title="AI環境アナリスト"
        description="社内向けの逆算シナリオとエグゼクティブ・サマリー（モック応答）"
        badge="モック"
      />

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={runAnalysis} disabled={loading}>
          <Sparkles className="size-4" />
          AIに分析・対策を検討させる
        </Button>
        {!shown && !loading ? (
          <Button type="button" variant="outline" onClick={runAnalysis}>
            サンプル分析を表示
          </Button>
        ) : null}
        <Badge variant="secondary">オフライン・モック</Badge>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        APIキー未設定時はモック応答です（合意どおり）。JAMA向け文案は含みません。
      </p>

      <div className="mt-4 min-h-[120px] rounded-lg border bg-muted/20 p-4">
        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="分析中">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : shown ? (
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="prose-sm max-w-none">
              {renderMarkdownLines(PANE4_MOCK_MARKDOWN)}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground">
            ボタンを押すと、Pane 1〜3 相当のサンプル文脈に基づくモック回答を表示します。
          </p>
        )}
      </div>
    </section>
  );
}
