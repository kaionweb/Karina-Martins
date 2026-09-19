import Link from "next/link";
import { Check, Play, Sparkles } from "lucide-react";
import type { LessonWithProgress } from "@ipp/shared";
import type { TrailAccent } from "@/lib/ui/posterGradients";

// Espelha LESSON_COMPLETION_XP de apps/api/.../lessons.service.ts — XP é
// sempre o mesmo por lição (sem variação por dificuldade), então replicamos
// a constante em vez de inventar valores diferentes por lição.
export const LESSON_COMPLETION_XP = 10;

interface LessonRowProps {
  lesson: LessonWithProgress;
  isCurrent: boolean;
  accent: TrailAccent;
}

export function LessonRow({ lesson, isCurrent, accent }: LessonRowProps) {
  const isCompleted = lesson.completed;

  return (
    <Link
      href={`/lesson/${lesson.id}`}
      className="group flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-transform hover:scale-[1.02]"
      style={{
        background: isCurrent ? `linear-gradient(135deg, ${accent.tint}, ${accent.tint2})` : "#FFFFFF",
        border: isCurrent ? `1px solid ${accent.border}` : "1px solid #E5EAF2",
        boxShadow: isCurrent ? `0 8px 24px -8px ${accent.glow}` : "none",
      }}
    >
      <div
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full"
        style={{
          background: isCompleted ? "linear-gradient(135deg, #4ade80, #16a34a)" : isCurrent ? accent.solid : "#F7F9FC",
          border: !isCompleted && !isCurrent ? "1px solid #E5EAF2" : "none",
          boxShadow: isCompleted || isCurrent ? "0 4px 14px -4px rgba(0,0,0,0.15)" : "none",
        }}
      >
        {isCompleted ? (
          <Check className="h-5 w-5 text-white" strokeWidth={3} aria-label="Lição concluída" />
        ) : isCurrent ? (
          <Play className="ml-0.5 h-4 w-4 fill-current text-white" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-body text-[11px] font-black" style={{ color: isCurrent ? accent.text : "#5C6B7D" }}>
            {String(lesson.order).padStart(2, "0")}
          </span>
          <h3 className="truncate font-display text-base font-semibold text-cinema-text">{lesson.title}</h3>
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-cinema-amber" />
          <span className="font-body text-xs font-bold text-cinema-muted">{LESSON_COMPLETION_XP} XP</span>
          {isCurrent ? (
            <span
              className="ml-1 rounded-full px-2 py-0.5 font-body text-[9px] font-black uppercase tracking-wider"
              style={{ backgroundColor: accent.chipBg, color: accent.text }}
            >
              Continuar
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
