import type { Badge } from "@ipp/shared";

interface BadgeGridProps {
  badges: Badge[];
  className?: string;
}

export function BadgeGrid({ badges, className }: BadgeGridProps) {
  if (badges.length === 0) {
    return (
      <p style={{ color: "hsl(var(--muted-foreground))" }}>Nenhum badge conquistado ainda.</p>
    );
  }

  return (
    <div className={className ?? "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"}>
      {badges.map((badge) => (
        <div
          key={badge.id}
          className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center"
          style={{
            backgroundColor: "hsl(var(--muted))",
            color: "hsl(var(--foreground))",
            borderColor: "hsl(var(--border))",
          }}
          data-icon-key={badge.iconKey}
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full text-2xl"
            style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            aria-hidden="true"
          >
            🏅
          </div>
          <h3 className="text-sm font-semibold">{badge.title}</h3>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            {badge.description}
          </p>
        </div>
      ))}
    </div>
  );
}
