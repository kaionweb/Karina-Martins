"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, Film } from "lucide-react";
import type { FilmeLevel, FilmeSummary, TranscriptSentence } from "@ipp/shared";
import { BrandGlow } from "@/components/decorative/brand-glow";
import { ProfileHeaderBadge } from "@/components/layout/ProfileHeaderBadge";
import { PlayerFacade, type PlayerControls } from "@/components/videos/PlayerFacade";
import { SentenceCard } from "@/components/videos/SentenceCard";
import { SentencePlayerControls } from "@/components/videos/SentencePlayerControls";
import { ChapterJumpList } from "@/components/videos/ChapterJumpList";
import { formatDuration } from "@/components/videos/VideoCard";
import { useSentenceLoop } from "@/hooks/useSentenceLoop";
import { levelStyle, type Nivel } from "@/lib/ui/levelStyles";
import { getFilme, getFilmeTranscript } from "@/lib/api/filmes";

const LEVEL_DB_TO_LABEL: Record<FilmeLevel, Nivel> = {
  BASICO: "Básico",
  INTERMEDIARIO: "Intermediário",
  AVANCADO: "Avançado",
};

// Acima deste número de frases o filme mostra o atalho de capítulos. Vídeos e
// episódios curtos (tipicamente < 10 frases) nunca chegam aqui.
const CHAPTERS_MIN_SENTENCES = 20;

function Header({ onBack }: { onBack: () => void }) {
  return (
    <div className="relative z-10 flex items-center justify-between border-b border-cinema-border px-5 pb-4 pt-6">
      <button
        type="button"
        onClick={onBack}
        aria-label="Voltar"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-cinema-border bg-cinema-surface"
      >
        <ArrowLeft className="h-4 w-4 text-cinema-text/80" />
      </button>
      <ProfileHeaderBadge />
    </div>
  );
}

export default function FilmeDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [filme, setFilme] = useState<FilmeSummary | null | undefined>(undefined);
  const [transcript, setTranscript] = useState<TranscriptSentence[]>([]);
  const [controls, setControls] = useState<PlayerControls | null>(null);
  const [drillActive, setDrillActive] = useState(false);

  useEffect(() => {
    if (!id) return;
    let ativo = true;

    getFilme(id)
      .then((res) => {
        if (ativo) setFilme(res);
      })
      .catch(() => {
        if (ativo) setFilme(null);
      });

    // Transcript é best-effort: filmes sem transcript cadastrado (lista vazia
    // ou falha) simplesmente não mostram a feature de repetição.
    getFilmeTranscript(id)
      .then((res) => {
        if (ativo) setTranscript(res);
      })
      .catch(() => {
        if (ativo) setTranscript([]);
      });

    return () => {
      ativo = false;
    };
  }, [id]);

  const loop = useSentenceLoop({ sentences: transcript, controls });

  if (filme === undefined) {
    return (
      <div className="relative min-h-[calc(100vh-96px)] w-full overflow-hidden">
        <BrandGlow />
        <Header onBack={() => router.back()} />
        <p className="relative z-10 mx-auto max-w-md px-5 py-16 text-center font-body text-[13px] text-cinema-muted">
          Carregando filme…
        </p>
      </div>
    );
  }

  if (!filme) {
    return (
      <div className="relative min-h-[calc(100vh-96px)] w-full overflow-hidden">
        <BrandGlow />
        <Header onBack={() => router.back()} />
        <p className="relative z-10 mx-auto max-w-md px-5 py-16 text-center font-body text-[13px] text-cinema-muted">
          Filme não encontrado.
        </p>
      </div>
    );
  }

  const style = levelStyle(LEVEL_DB_TO_LABEL[filme.level]);

  return (
    <div className="relative min-h-[calc(100vh-96px)] w-full overflow-hidden">
      <BrandGlow />
      <Header onBack={() => router.back()} />

      <div className="relative z-10 mx-auto w-full max-w-md px-5 pb-32 pt-6 sm:max-w-2xl md:max-w-4xl lg:max-w-5xl">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${style.cardGradient}`}
            style={{ boxShadow: `0 8px 24px -8px ${style.glow}` }}
          >
            <span className="text-2xl">{filme.emoji}</span>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold leading-tight text-cinema-text">{filme.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 font-body text-[10px] font-black uppercase tracking-wider text-white"
                style={{ background: style.chipBg }}
              >
                {style.label}
              </span>
              <span className="flex items-center gap-1 font-body text-xs font-bold text-cinema-muted">
                <Film className="h-3 w-3" />
                {filme.ageRange}
              </span>
              <span className="flex items-center gap-1 font-body text-xs font-bold text-cinema-muted">
                <Clock className="h-3 w-3" />
                {formatDuration(filme.durationSeconds)}
              </span>
            </div>
          </div>
        </div>

        <div
          className="mt-6 overflow-hidden rounded-2xl border border-cinema-border"
          style={{ boxShadow: `0 20px 50px -20px ${style.glow}` }}
        >
          <PlayerFacade
            videoId={filme.videoId}
            title={filme.title}
            thumbnailUrl={filme.thumbnailUrl ?? `https://i.ytimg.com/vi/${filme.videoId}/hqdefault.jpg`}
            onReady={setControls}
          />
        </div>

        {loop.total > 0 && loop.currentSentence ? (
          <section className="mt-6 flex flex-col gap-3" aria-label="Repetição de frase">
            <SentencePlayerControls
              speed={loop.speed}
              onSpeedChange={loop.setSpeed}
              loopActive={loop.loopActive}
              onLoopToggle={loop.setLoopActive}
              drillActive={drillActive}
              onDrillToggle={setDrillActive}
            />
            {transcript.length > CHAPTERS_MIN_SENTENCES ? (
              <ChapterJumpList sentences={transcript} onJump={(index) => loop.goToSentence(index)} />
            ) : null}
            <SentenceCard
              sentence={loop.currentSentence}
              index={loop.currentIndex}
              total={loop.total}
              progress={loop.progress}
              drillActive={drillActive}
              onPrev={() => loop.goToSentence(loop.currentIndex - 1)}
              onNext={() => loop.goToSentence(loop.currentIndex + 1)}
            />
          </section>
        ) : null}
      </div>
    </div>
  );
}
