"use client";

import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Pane4RailProps {
  open: boolean;
  onToggle: () => void;
}

export function Pane4Rail({ open, onToggle }: Pane4RailProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "relative z-30 flex w-11 shrink-0 cursor-pointer flex-col items-center justify-center gap-2 border-l border-border bg-muted/50 px-1 py-6 transition-colors hover:bg-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        open && "bg-muted",
      )}
      aria-expanded={open}
      aria-controls="pane-4"
      aria-label={open ? "AIペインを閉じる" : "AIペインを開く"}
    >
      {open ? (
        <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
      ) : (
        <ChevronLeft className="size-5 text-muted-foreground" aria-hidden />
      )}
      <Sparkles className="size-4 text-primary" aria-hidden />
      <span
        className="text-[10px] font-semibold tracking-wide text-foreground"
        style={{ writingMode: "vertical-rl" }}
      >
        AI分析
      </span>
    </button>
  );
}
