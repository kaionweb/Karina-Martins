import { cn } from "@/lib/utils";

interface XpBarProps {
  currentXp: number;
  className?: string;
}

// Componente puramente apresentacional — XP vem sempre do endpoint /gamification/xp
export function XpBar({ currentXp, className }: XpBarProps) {
  return (
    <div
      className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-2", className)}
      style={{ backgroundColor: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
    >
      <span aria-hidden="true">⭐</span>
      <span className="font-semibold">{currentXp} XP</span>
    </div>
  );
}
