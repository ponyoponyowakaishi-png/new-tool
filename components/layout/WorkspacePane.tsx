import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface WorkspacePaneProps {
  id: string;
  children: ReactNode;
  variant?: "default" | "demo";
  className?: string;
}

export function WorkspacePane({
  id,
  children,
  variant = "default",
  className,
}: WorkspacePaneProps) {
  return (
    <div
      id={id}
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col border-r border-border bg-card last:border-r-0",
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
