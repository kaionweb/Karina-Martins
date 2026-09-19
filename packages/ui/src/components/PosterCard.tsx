import type { MouseEventHandler, ReactNode } from "react";
import { cn } from "../lib/cn";

interface PosterCardProps {
  title: string;
  meta?: ReactNode;
  levelTag?: ReactNode;
  background: string;
  variant?: "grid" | "wide" | "hero";
  onClick?: MouseEventHandler<HTMLDivElement>;
  children?: ReactNode;
  className?: string;
}

const sizeByVariant: Record<NonNullable<PosterCardProps["variant"]>, string> = {
  grid: "h-[150px] w-full",
  wide: "h-[172px] w-full",
  hero: "w-full",
};

export function PosterCard({
  title,
  meta,
  levelTag,
  background,
  variant = "grid",
  onClick,
  children,
  className,
}: PosterCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-cinema-md border border-white/10",
        onClick && "cursor-pointer",
        sizeByVariant[variant],
        className,
      )}
      style={{ background }}
    >
      <div
        aria-hidden
        className="absolute inset-0 [background-image:radial-gradient(120%_90%_at_50%_-10%,rgba(255,255,255,.22),transparent_55%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-35 mix-blend-overlay [background-image:radial-gradient(rgba(255,255,255,.28)_.5px,transparent_.5px)] [background-size:4px_4px]"
      />
      <div className="relative flex h-full flex-col p-[13px]">
        {levelTag ? <div className="self-start">{levelTag}</div> : null}
        <div className="mt-auto">
          <div
            className={cn(
              "font-display font-extrabold leading-[1.05] text-white",
              variant === "hero" ? "text-2xl" : "text-lg",
            )}
          >
            {title}
          </div>
          {meta ? <div className="mt-[5px] text-[10.5px] font-semibold text-white/80">{meta}</div> : null}
          {children}
        </div>
      </div>
    </div>
  );
}
