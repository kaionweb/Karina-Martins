import Link from "next/link";
import type { JourneyResponse } from "@ipp/shared";
import { XpBar } from "@/components/gamification/XpBar";
import { BadgeGrid } from "@/components/gamification/BadgeGrid";

interface JourneyCardProps {
  journey: JourneyResponse;
  className?: string;
}

export function JourneyCard({ journey, className }: JourneyCardProps) {
  const { profile, xpTotal, badges, completedLessons } = journey;

  return (
    <section
      className={className ?? "flex flex-col gap-4 rounded-lg border p-6"}
      style={{
        backgroundColor: "hsl(var(--card))",
        color: "hsl(var(--card-foreground))",
        borderColor: "hsl(var(--border))",
      }}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{profile.nickname}</h2>
          {profile.ageRange ? (
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              {profile.ageRange} anos
            </p>
          ) : null}
        </div>
        <XpBar currentXp={xpTotal} />
      </header>

      <Link
        href={`/dashboard/transcripts/${profile.id}`}
        className="text-sm underline underline-offset-2"
        style={{ color: "hsl(var(--primary))" }}
      >
        Ver transcrições de conversas com a IA
      </Link>

      <p>
        Streak atual: <strong>{profile.currentStreak}</strong> dias · Recorde:{" "}
        <strong>{profile.longestStreak}</strong> dias
      </p>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Badges</h3>
        <BadgeGrid badges={badges} />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Lições concluídas ({completedLessons.length})</h3>
        {completedLessons.length === 0 ? (
          <p style={{ color: "hsl(var(--muted-foreground))" }}>Nenhuma lição concluída ainda.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {completedLessons.map((lesson) => (
              <li
                key={lesson.lessonId}
                className="rounded-md border p-3"
                style={{
                  backgroundColor: "hsl(var(--muted))",
                  color: "hsl(var(--foreground))",
                  borderColor: "hsl(var(--border))",
                }}
              >
                {lesson.title}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
