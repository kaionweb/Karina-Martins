import { cn } from "../lib/cn";

interface ProgressBarProps {
  value: number;
  size?: "sm" | "md";
  variant?: "gradient" | "solid";
  className?: string;
  trackClassName?: string;
}

export function ProgressBar({ value, size = "md", variant = "gradient", className, trackClassName }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "overflow-hidden rounded-cinema-full bg-cinema-surface-alt",
        size === "sm" ? "h-1" : "h-1.5",
        trackClassName,
      )}
    >
      <div
        className={cn(
          "h-full rounded-cinema-full transition-[width] duration-700 ease-out",
          variant === "gradient" ? "bg-gradient-to-r from-cinema-primary to-cinema-amber" : "bg-white",
          className,
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
