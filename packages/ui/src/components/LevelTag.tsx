import type { ReactNode } from "react";
import { cn } from "../lib/cn";

interface LevelTagProps {
  children: ReactNode;
  tone?: "onImage" | "solid";
  className?: string;
}

export function LevelTag({ children, tone = "onImage", className }: LevelTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-cinema-full px-[9px] py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-cinema-text backdrop-blur-md",
        tone === "onImage" ? "border border-white/20 bg-black/45" : "border border-cinema-border bg-cinema-surface-alt",
        className,
      )}
    >
      {children}
    </span>
  );
}
