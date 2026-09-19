"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { LessonWithProgress, Show } from "@ipp/shared";
import { getLessonsForTrack, getTracksForShow, listShows } from "@/lib/api/catalog";
import { accentForIndex, gradientForIndex } from "@/lib/ui/posterGradients";
import { BrandGlow } from "@/components/decorative/brand-glow";
import { LessonRow } from "@/components/catalog/LessonRow";
import { ProfileHeaderBadge } from "@/components/layout/ProfileHeaderBadge";

export default function TrackLessonsPage() {
  const router = useRouter();
  const params = useParams<{ showId: string }>();

  const [show, setShow] = useState<Show | null>(null);
  // Posição do show na lista real (mesma ordem usada na Home/Explorar) — é o
  // que decide a cor da trilha aqui, pra não fixar uma cor só pra qualquer uma.
  const [showIndex, setShowIndex] = useState(0);
  const [lessons, setLessons] = useState<LessonWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    async function load() {
      try {
        // Não existe GET de show único — busca a lista e filtra (mesmo padrão
        // já usado em lib/api/journey.ts).
        const [shows, tracks] = await Promise.all([listShows(), getTracksForShow(params.showId)]);
        if (!ativo) return;

        const index = shows.findIndex((s) => s.id === params.showId);
        setShow(index >= 0 ? shows[index] : null);
        setShowIndex(Math.max(index, 0));

        // Assume-se 1 trilha por show (mesma premissa da implementação anterior).
        const firstTrack = tracks[0];
        const trackLessons = firstTrack ? await getLessonsForTrack(firstTrack.id) : [];
        if (ativo) setLessons(trackLessons);
      } catch {
        if (ativo) setError("Não foi possível carregar a trilha.");
      } finally {
        if (ativo) setLoading(false);
      }
    }

    load();
    return () => {
      ativo = false;
    };
  }, [params.showId]);

  const accent = accentForIndex(showIndex);
  const completedCount = lessons.filter((l) => l.completed).length;
  const progressPct = lessons.length === 0 ? 0 : (completedCount / lessons.length) * 100;
  // Primeira lição não concluída, na ordem — não é um "gate" de acesso (nada
  // trava lição nenhuma no backend), é só qual delas ganha o destaque "atual".
  const currentLessonId = lessons.find((l) => !l.completed)?.id ?? null;

  return (
    <div className="relative min-h-[calc(100vh-96px)] w-full overflow-hidden">
      <BrandGlow />

      <div className="relative z-10 flex items-center justify-between border-b border-cinema-border px-5 pb-4 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Voltar"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-cinema-border bg-cinema-surface"
        >
          <ArrowLeft className="h-4 w-4 text-cinema-text/80" />
        </button>

        <ProfileHeaderBadge />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md px-5 pb-12 sm:max-w-2xl md:max-w-4xl lg:max-w-5xl">
        {loading ? (
          <p className="py-10 text-center text-[13px] text-cinema-muted">Carregando…</p>
        ) : error ? (
          <p className="py-10 text-center text-[13px] text-cinema-muted">{error}</p>
        ) : (
          <>
            <div className="mt-6">
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: gradientForIndex(showIndex), boxShadow: `0 8px 24px -8px ${accent.glow}` }}
                >
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold leading-tight text-cinema-text">
                    {show?.title ?? "Trilha"}
                  </h1>
                  <span className="font-body text-xs font-bold text-cinema-muted">
                    {completedCount} de {lessons.length} lições completas
                  </span>
                </div>
              </div>

              <div className="relative h-2.5 overflow-hidden rounded-full bg-cinema-border">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000"
                  style={{ width: `${progressPct}%`, background: gradientForIndex(showIndex), boxShadow: `0 0 12px ${accent.glow}` }}
                />
              </div>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lessons.map((lesson) => (
                <LessonRow key={lesson.id} lesson={lesson} isCurrent={lesson.id === currentLessonId} accent={accent} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
