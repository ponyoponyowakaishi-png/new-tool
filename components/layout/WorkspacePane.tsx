import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type WorkspacePaneLayout = "equal" | "drawer";

interface WorkspacePaneProps {
  id: string;
  children: ReactNode;
  variant?: "default" | "demo";
  layout?: WorkspacePaneLayout;
  className?: string;
}

export function WorkspacePane({
  id,
  children,
  variant = "default",
  layout = "equal",
  className,
}: WorkspacePaneProps) {
  return (
    <div
      id={id}
      className={cn(
        "flex min-h-0 flex-col border-r border-border bg-card",
        layout === "equal" && "min-w-0 flex-1",
        layout === "drawer" &&
          "relative z-20 w-80 max-w-[38vw] shrink-0 grow-0 basis-80",
        variant === "demo" &&
          "border-amber-500/30 border-l-4 border-l-amber-500",
        className,
      )}
    >
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4">
        {children}
      </div>
    </div>
  );
}
