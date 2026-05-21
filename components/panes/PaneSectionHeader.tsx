import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

interface PaneSectionHeaderProps {
  number: number;
  title: string;
  description: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "outline" | "destructive";
  trailing?: ReactNode;
  /** 横4ペイン用のコンパクト表示 */
  compact?: boolean;
}

export function PaneSectionHeader({
  number,
  title,
  description,
  badge,
  badgeVariant = "secondary",
  trailing,
  compact = false,
}: PaneSectionHeaderProps) {
  return (
    <div
      className={
        compact
          ? "mb-4 flex flex-col gap-2"
          : "mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
      }
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={
              compact
                ? "flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground"
                : "flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
            }
          >
            {number}
          </span>
          <h2
            className={
              compact
                ? "text-sm font-semibold leading-tight tracking-tight"
                : "text-lg font-semibold tracking-tight"
            }
          >
            {title}
          </h2>
          {badge ? (
            <Badge
              variant={badgeVariant}
              className={compact ? "text-[10px]" : undefined}
            >
              {badge}
            </Badge>
          ) : null}
        </div>
        <p
          className={
            compact ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"
          }
        >
          {description}
        </p>
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}
