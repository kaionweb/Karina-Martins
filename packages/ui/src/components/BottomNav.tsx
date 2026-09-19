import Link from "next/link";
import type { ComponentType } from "react";
import { cn } from "../lib/cn";

export interface BottomNavItem {
  key: string;
  label: string;
  href: string;
  icon: ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  active?: boolean;
  variant?: "default" | "orb";
}

interface BottomNavProps {
  items: BottomNavItem[];
  className?: string;
}

export function BottomNav({ items, className }: BottomNavProps) {
  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        "mx-auto w-full max-w-md px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl",
        className,
      )}
    >
      <div className="relative flex items-end justify-around rounded-3xl border border-cinema-border bg-white/90 px-3 py-3 shadow-[0_20px_50px_-10px_rgba(45,101,174,0.25)] backdrop-blur-xl">
        {items.map(({ key, label, href, icon: Icon, active, variant }) => (
          <Link
            key={key}
            href={href}
            className={cn(
              "group flex flex-col items-center gap-1 transition-colors",
              variant === "orb" ? "-mt-8" : "flex-1 py-1",
            )}
          >
            {variant === "orb" ? (
              <>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cinema-primary to-cinema-primary-alt text-white shadow-cinema-orb transition-transform group-hover:scale-110">
                  <Icon size={22} strokeWidth={2.5} />
                </span>
                <span
                  className={cn(
                    "font-body text-[10px] font-black uppercase tracking-wider",
                    active ? "text-cinema-primary" : "text-cinema-muted",
                  )}
                >
                  {label}
                </span>
              </>
            ) : (
              <>
                <Icon size={20} strokeWidth={active ? 2.5 : 2} className={active ? "text-cinema-primary" : "text-cinema-muted"} />
                <span className={cn("font-body text-[10px] font-bold", active ? "text-cinema-primary" : "text-cinema-muted")}>{label}</span>
                {active ? <span className="mt-0.5 h-1 w-1 rounded-full bg-cinema-primary" /> : null}
              </>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
