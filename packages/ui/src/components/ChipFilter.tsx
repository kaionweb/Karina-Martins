import type { ReactNode } from "react";
import { cn } from "../lib/cn";

interface ChipFilterProps {
  label: ReactNode;
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
}

export function ChipFilter({ label, selected = false, onSelect, className }: ChipFilterProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "whitespace-nowrap rounded-cinema-full border px-[15px] py-[9px] text-[13px] font-medium transition-all",
        selected
          ? "border-transparent bg-gradient-to-br from-cinema-primary to-cinema-primary-alt font-semibold text-white shadow-cinema-glow"
          : "border-cinema-border bg-cinema-surface-alt text-cinema-muted",
        className,
      )}
    >
      {label}
    </button>
  );
}
