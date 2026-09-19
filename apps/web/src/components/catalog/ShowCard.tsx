import Link from "next/link";
import { cn } from "@/lib/utils";

interface ShowCardProps {
  id: string;
  title: string;
  synopsis?: string;
  thumbnailKey?: string;
  className?: string;
}

export function ShowCard({ id, title, synopsis, thumbnailKey, className }: ShowCardProps) {
  return (
    <Link
      href={`/catalog/${id}`}
      className={cn("block rounded-lg border p-4", className)}
      style={{
        backgroundColor: "hsl(var(--muted))",
        color: "hsl(var(--foreground))",
        borderColor: "hsl(var(--border))",
      }}
      data-thumbnail-key={thumbnailKey}
    >
      <div
        className="mb-3 flex h-24 items-center justify-center rounded-md text-2xl font-bold"
        style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
        aria-hidden="true"
      >
        {title.charAt(0).toUpperCase()}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {synopsis ? (
        <p className="mt-1 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          {synopsis}
        </p>
      ) : null}
    </Link>
  );
}
