import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

interface PaneSectionHeaderProps {
  number: number;
  title: string;
  description: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "outline" | "destructive";
  trailing?: ReactNode;
}

export function PaneSectionHeader({
  number,
  title,
  description,
  badge,
  badgeVariant = "secondary",
  trailing,
}: PaneSectionHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {number}
          </span>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {badge ? <Badge variant={badgeVariant}>{badge}</Badge> : null}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}
