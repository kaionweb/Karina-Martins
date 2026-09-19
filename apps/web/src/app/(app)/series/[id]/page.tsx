"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Check, Clock, Crown, Layers, Play, Tv } from "lucide-react";
import type { SeriesEpisodeWithProgress, SeriesLevel, SeriesSummary, TranscriptSentence } from "@ipp/shared";
import Link from "next/link";
import { BrandGlow } from "@/components/decorative/brand-glow";
import { ProfileHeaderBadge } from "@/components/layout/ProfileHeaderBadge";
import { PlayerFacade, type PlayerControls } from "@/components/videos/PlayerFacade";
import { SentenceCard } from "@/components/videos/SentenceCard";
import { SentencePlayerControls } from "@/components/videos/SentencePlayerControls";
import { useSentenceLoop } from "@/hooks/useSentenceLoop";
import { useProfileStore } from "@/stores/useProfileStore";
import { levelStyle, type Nivel } from "@/lib/ui/levelStyles";
import { ApiRequestError } from "@/lib/api/catalog";
import { getEpisodeTranscript, getSeriesEpisodes, listSeries, toggleEpisodeWatched } from "@/lib/api/series";

const LEVEL_DB_TO_LABEL: Record<SeriesLevel, Nivel> = {
  BASICO: "Básico",
  INTERMEDIARIO: "Intermediário",
  AVANCADO: "Avançado",
};

export default function SerieDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const isGuest = !useProfileStore((state) => state.activeProfile);

  const [serie, setSerie] = useState<SeriesSummary | null | undefined>(undefined);
  const [episodios, setEpisodios] = useState<SeriesEpisodeWithProgress[]>([]);
  const [activeEpisodio, setActiveEpisodio] = useState<SeriesEpisodeWithProgress | undefined>();
  const [loading, setLoading] = useState(true);
  // 403 da API (trial expirado / nível não desbloqueado) — distinto de "não
  // encontrada": o card da lista pode ter mudado de estado (trial acabou
  // entre a listagem e o clique) ou o link foi acessado direto por URL,
  // contornando o cadeado da UI. A trava de verdade é a resposta da API.
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function load() {
      setLocked(false);
      try {
        // Não existe GET de série única — busca a lista e filtra (mesmo padrão
        // já usado em lib/api/catalog.ts pra Show).
        const seriesList = await listSeries();
        if (!ativo) return;

        const target = seriesList.find((item) => item.id === params.id) ?? null;
        setSerie(target);
        if (!target) return;

        try {
          const episodes = await getSeriesEpisodes(params.id);
          if (!ativo) return;
          setEpisodios(episodes);
          setActiveEpisodio(episodes.find((e) => !e.watched) ?? episodes[0]);
        } catch (err) {
          if (!ativo) return;
          if (err instanceof ApiRequestError && err.status === 403) {
            setLocked(true);
          }
        }
      } catch {
        if (ativo) setSerie(null);
      } finally {
        if (ativo) setLoading(false);
      }
    }

    load();
    return () => {
      ativo = false;
    };
  }, [params.id]);

  async function handleToggleWatched(episodio: SeriesEpisodeWithProgress) {
    const { watched } = await toggleEpisodeWatched(episodio.id);
    setEpisodios((prev) => prev.map((e) => (e.id === episodio.id ? { ...e, watched } : e)));
    setActiveEpisodio((prev) => (prev?.id === episodio.id ? { ...prev, watched } : prev));
  }

  if (loading || serie === undefined) {
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
        <p className="relative z-10 mx-auto max-w-md px-5 py-16 text-center font-body text-[13px] text-cinema-muted">
          Carregando…
        </p>
      </div>
    );
  }

  if (!serie) {
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
        <p className="relative z-10 mx-auto max-w-md px-5 py-16 text-center font-body text-[13px] text-cinema-muted">
          Série não encontrada.
        </p>
      </div>
    );
  }

  const style = levelStyle(LEVEL_DB_TO_LABEL[serie.level]);
  const watchedCount = episodios.filter((e) => e.watched).length;

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

      <div className="relative z-10 mx-auto w-full max-w-md px-5 pb-32 sm:max-w-2xl md:max-w-4xl lg:max-w-5xl">
        <div className="mt-6 flex items-center gap-3">
          <div
            className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${style.cardGradient}`}
            style={{ boxShadow: `0 8px 24px -8px ${style.glow}` }}
          >
            <span className="text-2xl">{serie.emoji}</span>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold leading-tight text-cinema-text">{serie.title}</h1>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 font-body text-[10px] font-black uppercase tracking-wider text-white"
                style={{ background: style.chipBg }}
              >
                {style.label}
              </span>
              <span className="flex items-center gap-1 font-body text-xs font-bold text-cinema-muted">
                <Layers className="h-3 w-3" />
                {serie.seasons} {serie.seasons > 1 ? "temporadas" : "temporada"}
                {episodios.length > 0 ? ` · ${watchedCount}/${episodios.length} eps` : ` · ${serie.episodesCount} eps`}
              </span>
            </div>
          </div>
        </div>

        {serie.description && (
          <p className="mt-4 font-body text-sm leading-relaxed text-cinema-text/80">{serie.description}</p>
        )}

        {locked ? (
          <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/5 px-5 py-14 text-center">
            <Crown className="h-6 w-6 text-amber-500" />
            <p className="font-display text-[15px] font-semibold text-cinema-text">Conteúdo bloqueado</p>
            {isGuest ? (
              <>
                <p className="font-body text-[13px] text-cinema-muted">
                  Essa série faz parte do catálogo completo, liberado pra quem tem conta (com 7 dias grátis pra testar tudo).
                </p>
                <Link
                  href="/register"
                  className="mt-3 rounded-full bg-cinema-primary px-5 py-2.5 font-display text-sm font-bold text-white"
                >
                  Crie uma conta grátis
                </Link>
              </>
            ) : (
              <p className="font-body text-[13px] text-cinema-muted">
                Seu trial acabou e essa série não está disponível no plano gratuito. Assine o Premium ou complete o nível
                anterior pra desbloquear.
              </p>
            )}
          </div>
        ) : serie.playlistId && activeEpisodio ? (
          <>
            <EpisodePlayer
              episodio={activeEpisodio}
              style={style}
              isGuest={isGuest}
              onToggleWatched={() => handleToggleWatched(activeEpisodio)}
            />
            <EpisodeList episodios={episodios} activeId={activeEpisodio.id} onSelect={setActiveEpisodio} />
          </>
        ) : (
          <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-cinema-border bg-cinema-surface px-5 py-14 text-center">
            <Tv className="h-6 w-6 text-cinema-muted" />
            <p className="font-display text-[15px] font-semibold text-cinema-text">Em produção</p>
            <p className="font-body text-[13px] text-cinema-muted">Essa série ainda está em produção — volte em breve!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EpisodePlayer({
  episodio,
  style,
  isGuest,
  onToggleWatched,
}: {
  episodio: SeriesEpisodeWithProgress;
  style: ReturnType<typeof levelStyle>;
  isGuest: boolean;
  onToggleWatched: () => void;
}) {
  const [transcript, setTranscript] = useState<TranscriptSentence[]>([]);
  const [controls, setControls] = useState<PlayerControls | null>(null);
  const [drillActive, setDrillActive] = useState(false);

  // Transcript é best-effort: episódios sem transcript cadastrado (lista vazia
  // ou falha) simplesmente não mostram a feature de repetição.
  useEffect(() => {
    let ativo = true;
    setControls(null);
    setTranscript([]);
    getEpisodeTranscript(episodio.id)
      .then((res) => {
        if (ativo) setTranscript(res);
      })
      .catch(() => {
        if (ativo) setTranscript([]);
      });
    return () => {
      ativo = false;
    };
  }, [episodio.id]);

  const loop = useSentenceLoop({ sentences: transcript, controls });

  return (
    <div className="mt-6 flex flex-col gap-3">
      <div
        className="overflow-hidden rounded-2xl border border-cinema-border"
        style={{ boxShadow: `0 20px 50px -20px ${style.glow}` }}
      >
        <PlayerFacade
          key={episodio.id}
          videoId={episodio.videoId}
          title={`Episódio ${episodio.number} · ${episodio.title}`}
          thumbnailUrl={episodio.thumbnailUrl}
          onReady={setControls}
        />
        <div className="flex items-center justify-between gap-2 border-t border-cinema-border bg-cinema-surface px-4 py-2.5">
          <span className="min-w-0 truncate font-body text-xs font-bold text-cinema-text/80">
            EP {episodio.number} · {episodio.title}
          </span>
          <div className="flex flex-shrink-0 items-center gap-3">
            <span className="flex items-center gap-1 font-body text-[10px] font-bold text-cinema-muted">
              <Clock className="h-2.5 w-2.5" />
              {formatDuration(episodio.durationSeconds)}
            </span>
            {!isGuest && (
              <button
                type="button"
                onClick={onToggleWatched}
                className="flex items-center gap-1 rounded-full border px-2 py-1 font-body text-[10px] font-bold transition-colors"
                style={
                  episodio.watched
                    ? { borderColor: "rgba(74,222,128,0.4)", backgroundColor: "rgba(74,222,128,0.12)", color: "#4ade80" }
                    : { borderColor: "#E5EAF2", backgroundColor: "#F7F9FC", color: "#5C6B7D" }
                }
              >
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
                {episodio.watched ? "Assistido" : "Marcar como assistido"}
              </button>
            )}
          </div>
        </div>
      </div>

      {loop.total > 0 && loop.currentSentence ? (
        <section className="flex flex-col gap-3" aria-label="Repetição de frase">
          <SentencePlayerControls
            speed={loop.speed}
            onSpeedChange={loop.setSpeed}
            loopActive={loop.loopActive}
            onLoopToggle={loop.setLoopActive}
            drillActive={drillActive}
            onDrillToggle={setDrillActive}
          />
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
  );
}

function EpisodeList({
  episodios,
  activeId,
  onSelect,
}: {
  episodios: SeriesEpisodeWithProgress[];
  activeId: string;
  onSelect: (episodio: SeriesEpisodeWithProgress) => void;
}) {
  return (
    <div className="mt-6">
      <h2 className="mb-3 font-display text-base font-bold text-cinema-text">Episódios</h2>
      <div className="space-y-2.5">
        {episodios.map((episodio) => (
          <EpisodeRow key={episodio.id} episodio={episodio} isActive={episodio.id === activeId} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function EpisodeRow({
  episodio,
  isActive,
  onSelect,
}: {
  episodio: SeriesEpisodeWithProgress;
  isActive: boolean;
  onSelect: (episodio: SeriesEpisodeWithProgress) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(episodio)}
      className="group flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-transform hover:scale-[1.01]"
      style={{
        background: isActive
          ? "linear-gradient(135deg, rgba(45,101,174,0.15), rgba(71,153,193,0.1))"
          : "#FFFFFF",
        border: isActive ? "1px solid rgba(45,101,174,0.35)" : "1px solid #E5EAF2",
      }}
    >
      <div className="relative h-14 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-cinema-border">
        <Image src={episodio.thumbnailUrl} alt={episodio.title} fill sizes="96px" className="object-cover" />
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="h-5 w-5 fill-current text-white" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-body text-[11px] font-black" style={{ color: isActive ? "#2D65AE" : "#5C6B7D" }}>
            EP {episodio.number}
          </span>
          {episodio.watched && <Check className="h-3 w-3 text-green-400" strokeWidth={3} />}
        </div>
        <h3 className="truncate font-display text-sm font-semibold text-cinema-text">{episodio.title}</h3>
        <div className="mt-0.5 flex items-center gap-1">
          <Clock className="h-2.5 w-2.5 text-cinema-muted" />
          <span className="font-body text-[10px] font-bold text-cinema-muted">{formatDuration(episodio.durationSeconds)}</span>
        </div>
      </div>
    </button>
  );
}
