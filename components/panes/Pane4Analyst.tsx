"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useSimulator } from "@/components/simulator/SimulatorProvider";
import { PaneSectionHeader } from "@/components/panes/PaneSectionHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateFromState } from "@/lib/calculations";
import { PORTFOLIO_LABELS } from "@/lib/sample-data";
import { toCalculationInput } from "@/lib/selectors";

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
  const { state } = useSimulator();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [lastMode, setLastMode] = useState<"mock" | "live" | null>(null);

  useEffect(() => {
    void fetch("/api/analyze")
      .then((response) => response.json())
      .then((data: { configured?: boolean }) => {
        setAiConfigured(Boolean(data.configured));
      })
      .catch(() => {
        setAiConfigured(false);
      });
  }, []);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    setContent("");
    setLastMode(null);

    const payload = {
      input: toCalculationInput(state),
      result: calculateFromState(state),
      portfolioLabel: PORTFOLIO_LABELS[state.activePortfolio],
    };

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const mode = response.headers.get("X-AI-Mode");
      if (mode === "mock" || mode === "live") {
        setLastMode(mode);
      }

      if (!response.ok) {
        let message = "AI 分析の取得に失敗しました。";
        try {
          const data = (await response.json()) as { error?: string };
          if (data.error) message = data.error;
        } catch {
          // ignore JSON parse errors
        }
        setError(message);
        return;
      }

      if (!response.body) {
        setError("応答ストリームを読み取れませんでした。");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setContent(accumulated);
      }
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "AI 分析の取得中にエラーが発生しました。";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [state]);

  const modeBadge =
    lastMode === "live" || (lastMode === null && aiConfigured)
      ? { label: "GPT-4o-mini", variant: "default" as const }
      : { label: "モック", variant: "secondary" as const };

  return (
    <div>
      <PaneSectionHeader
        compact
        number={4}
        title="AIアナリスト"
        description={
          aiConfigured
            ? "Pane 1〜3 の最新データを OpenAI で分析"
            : "社内向けモック（逆算＋要約）"
        }
        badge={aiConfigured ? undefined : "モック"}
      />

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void runAnalysis()} disabled={loading}>
          <Sparkles className="size-4" />
          AIに分析・対策を検討させる
        </Button>
        <Badge variant={modeBadge.variant}>{modeBadge.label}</Badge>
        {!aiConfigured ? (
          <Badge variant="outline">APIキー未設定</Badge>
        ) : null}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {aiConfigured
          ? "OpenAI GPT-4o-mini でストリーミング生成します。JAMA向け文案は含みません。"
          : "OPENAI_API_KEY 未設定時はモック応答です（合意どおり）。JAMA向け文案は含みません。"}
      </p>

      <div className="mt-4 min-h-[120px] rounded-lg border bg-muted/20 p-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {loading && !content ? (
          <div className="space-y-3" aria-busy="true" aria-label="分析中">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : content ? (
          <ScrollArea className="h-[min(50vh,400px)] pr-4">
            <div className="prose-sm max-w-none">
              {renderMarkdownLines(content)}
            </div>
          </ScrollArea>
        ) : !error ? (
          <p className="text-sm text-muted-foreground">
            ボタンを押すと、Pane 1〜3 の現在の入力に基づく分析を生成します。
          </p>
        ) : null}
      </div>
    </div>
  );
}
