import type { ReactNode } from "react";
import { cn } from "../lib/cn";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  layout?: "tile" | "inline";
  unit?: string;
  bordered?: boolean;
  className?: string;
}

export function StatCard({ label, value, icon, layout = "tile", unit, bordered = false, className }: StatCardProps) {
  if (layout === "inline") {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-[5px]",
          bordered && "border-l border-cinema-border",
          className,
        )}
      >
        {icon}
        <div className="font-display text-lg font-bold text-cinema-text">{value}</div>
        <div className="text-[11px] text-cinema-muted">{label}</div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-cinema-lg border border-cinema-border bg-cinema-surface px-4 pb-[14px] pt-4", className)}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cinema-muted">{label}</div>
      <div className="mt-2 flex items-center justify-between">
        <div className="font-display text-[30px] font-bold leading-none text-cinema-text">
          {value}
          {unit ? <span className="ml-[5px] text-[13px] font-medium text-cinema-muted">{unit}</span> : null}
        </div>
        {icon}
      </div>
    </div>
  );
}
