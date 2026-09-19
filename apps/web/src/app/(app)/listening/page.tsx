"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Headphones, Loader2, Pause, Play, Search } from "lucide-react";
import type { AccessStatus, VideoLevel, VideoSummary } from "@ipp/shared";
import { BrandGlow } from "@/components/decorative/brand-glow";
import { ProfileHeaderBadge } from "@/components/layout/ProfileHeaderBadge";
import { AccessLockBadge, AccessLockCaption } from "@/components/access-control/AccessLock";
import { AdminAccessPreviewToggle, AdminAccessPreviewHint } from "@/components/access-control/AdminAccessPreviewToggle";
import { TrialBanner } from "@/components/access-control/TrialBanner";
import { useListeningCatalog } from "@/lib/progression/useListeningCatalog";
import { loadIframeApi, type YTPlayer } from "@/lib/youtube-iframe";

const NIVEIS: { value: VideoLevel; label: string }[] = [
  { value: "INICIANTE", label: "Iniciante" },
  { value: "INTERMEDIARIO", label: "Intermediário" },
  { value: "AVANCADO", label: "Avançado" },
];

// Mesma paleta por nível usada em /videos; Avançado reaproveita o roxo/vermelho
// já usado em Séries e Filmes (lib/ui/levelStyles.ts) pra manter o mesmo código
// de cor por nível em todo o app.
const LEVEL_STYLES: Record<VideoLevel, { label: string; chipBg: string; glow: string; badgeColor: string; badgeBg: string }> = {
  INICIANTE: {
    label: "Iniciante",
    chipBg: "linear-gradient(135deg, #2D65AE, #4799C1)",
    glow: "rgba(45,101,174,0.35)",
    badgeColor: "#2D65AE",
    badgeBg: "rgba(45,101,174,0.1)",
  },
  INTERMEDIARIO: {
    label: "Intermediário",
    chipBg: "linear-gradient(135deg, #DA233B, #FBC607)",
    glow: "rgba(218,35,59,0.35)",
    badgeColor: "#DA233B",
    badgeBg: "rgba(218,35,59,0.1)",
  },
  AVANCADO: {
    label: "Avançado",
    chipBg: "linear-gradient(135deg, #1E4A85, #DA233B)",
    glow: "rgba(30,74,133,0.35)",
    badgeColor: "#1E4A85",
    badgeBg: "rgba(30,74,133,0.1)",
  },
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ListeningPage() {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [nivel, setNivel] = useState<VideoLevel | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { videos, loading, error, isAdmin, statusById, trialActive, trialDaysLeft, bypass, adminPreview } =
    useListeningCatalog();

  const itens = videos.filter((v) => {
    if (nivel && v.level !== nivel) return false;
    if (busca && !v.title.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

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
          <ArrowLeft className="h-4 w-4 text-cinema-muted" />
        </button>
        <ProfileHeaderBadge />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md px-5 pb-12 sm:max-w-2xl md:max-w-4xl lg:max-w-5xl">
        <div className="pt-5">
          <div className="mb-1 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Headphones className="h-5 w-5" style={{ color: "#4799C1" }} />
              <h1 className="font-display text-2xl font-bold text-cinema-text">Listening</h1>
            </div>
            {isAdmin && <AdminAccessPreviewToggle adminPreview={adminPreview} />}
          </div>
          <div className="flex items-start justify-between gap-3">
            <p className="font-body text-sm text-cinema-muted">Treine o ouvido com áudios curtos em inglês</p>
            <span className="mt-1 flex-shrink-0 rounded-full border border-cinema-border bg-cinema-surface-alt px-2.5 py-1 font-body text-[10px] font-black uppercase tracking-wider text-cinema-muted">
              {videos.length} faixas
            </span>
          </div>
        </div>

        <div className="mt-4">
          <AdminAccessPreviewHint adminPreview={adminPreview} />
          <TrialBanner trialActive={trialActive} bypass={bypass} daysLeft={trialDaysLeft} />
        </div>

        <div className="mt-5 flex items-center rounded-2xl border border-cinema-border bg-cinema-surface">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center text-cinema-muted">
            <Search className="h-4 w-4" />
          </div>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar faixa…"
            className="h-11 flex-1 bg-transparent pr-3 font-body text-sm font-semibold text-cinema-text placeholder:text-cinema-muted outline-none"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NIVEIS.map((n) => (
            <LevelChip
              key={n.value}
              nivel={n.value}
              active={nivel === n.value}
              onClick={() => setNivel((prev) => (prev === n.value ? null : n.value))}
            />
          ))}
        </div>

        <section className="mb-7 mt-6 space-y-3">
          {loading ? (
            <p className="py-10 text-center font-body text-[13px] text-cinema-muted">Carregando faixas…</p>
          ) : error ? (
            <p className="py-10 text-center font-body text-[13px] text-cinema-muted">
              Não foi possível carregar as faixas. Tente novamente.
            </p>
          ) : itens.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-display text-[15px] font-semibold text-cinema-text">Nenhuma faixa por aqui ainda</p>
              <p className="mt-1 text-[13px] text-cinema-muted">Nenhuma faixa corresponde aos filtros selecionados.</p>
            </div>
          ) : (
            itens.map((item) => (
              <TrackRow
                key={item.id}
                item={item}
                status={statusById[item.id] ?? "locked-premium"}
                isExpanded={expandedId === item.id}
                onToggle={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}
              />
            ))
          )}
        </section>
      </div>
    </div>
  );
}

function LevelChip({ nivel, active, onClick }: { nivel: VideoLevel; active: boolean; onClick: () => void }) {
  const style = LEVEL_STYLES[nivel];
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 rounded-full border px-3.5 py-1.5 font-body text-xs font-bold transition-all"
      style={
        active
          ? { background: style.chipBg, color: "#ffffff", boxShadow: `0 4px 16px -4px ${style.glow}`, borderColor: "rgba(255,255,255,0.4)" }
          : { backgroundColor: "rgb(var(--cinema-surface-alt))", borderColor: "rgb(var(--cinema-border))", color: "rgb(var(--cinema-muted))" }
      }
    >
      {style.label}
    </button>
  );
}

// Player de áudio oculto: carrega o YouTube IFrame Player num container de
// tamanho zero — o áudio toca normalmente, só o vídeo não é exibido. Mesma
// API do PlayerFacade visível (ver apps/web/src/lib/youtube-iframe.ts),
// mas com progresso/duração vindos do banco (item.durationSeconds), não de
// metadata de arquivo — não há <audio src> nem mp3 hospedado neste projeto.
function TrackRow({
  item,
  status,
  isExpanded,
  onToggle,
}: {
  item: VideoSummary;
  status: AccessStatus;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const style = LEVEL_STYLES[item.level];
  const isUnlocked = status === "unlocked" && !!item.videoId;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    if (!isExpanded || !containerRef.current || !item.videoId) return;
    let cancelled = false;

    void loadIframeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;
      playerRef.current = new YT.Player(containerRef.current, {
        videoId: item.videoId as string,
        // Domínio sem cookies + sem autoplay: nenhum dado do perfil-criança vai
        // ao player além do embed padrão (CLAUDE.md, seção Perfis CHILD).
        host: "https://www.youtube-nocookie.com",
        playerVars: { rel: 0, playsinline: 1 },
        events: {
          onReady: () => {
            if (!cancelled) setPlayerReady(true);
          },
          onStateChange: (event) => {
            setIsPlaying(event.data === YT.PlayerState.PLAYING);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      setPlayerReady(false);
      setIsPlaying(false);
      setCurrentTime(0);
    };
  }, [isExpanded, item.videoId]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime(playerRef.current?.getCurrentTime() ?? 0);
    }, 250);
    return () => clearInterval(interval);
  }, [isPlaying]);

  function togglePlay() {
    const player = playerRef.current;
    if (!player) return;
    if (isPlaying) player.pauseVideo();
    else player.playVideo();
  }

  function handleRowClick() {
    if (!isUnlocked) return;
    if (!isExpanded) onToggle();
    else togglePlay();
  }

  function handleSeek(e: MouseEvent<HTMLDivElement>) {
    const player = playerRef.current;
    if (!player || !item.durationSeconds) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const target = pct * item.durationSeconds;
    player.seekTo(target, true);
    setCurrentTime(target);
  }

  const progressPct = item.durationSeconds ? (currentTime / item.durationSeconds) * 100 : 0;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface transition-all"
      style={isExpanded ? { borderColor: `${style.badgeColor}40` } : undefined}
    >
      <button
        type="button"
        onClick={handleRowClick}
        disabled={!isUnlocked}
        className="flex w-full items-center gap-4 p-3.5 text-left disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-cinema-surface-alt">
          {isPlaying ? (
            <div className="flex h-4 items-end gap-0.5">
              <span className="h-full w-0.5 animate-pulse" style={{ backgroundColor: style.badgeColor }} />
              <span className="h-full w-0.5 animate-pulse" style={{ backgroundColor: style.badgeColor, animationDelay: "0.15s" }} />
              <span className="h-full w-0.5 animate-pulse" style={{ backgroundColor: style.badgeColor, animationDelay: "0.3s" }} />
            </div>
          ) : (
            <Image
              src={item.thumbnailUrl}
              alt=""
              fill
              sizes="48px"
              className="object-cover"
              style={{ filter: isUnlocked ? undefined : "grayscale(0.7) brightness(0.75)" }}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-sm font-semibold text-cinema-text">{item.title}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="rounded-full px-1.5 py-0.5 font-body text-[9px] font-black uppercase"
              style={{ backgroundColor: style.badgeBg, color: style.badgeColor }}
            >
              {style.label}
            </span>
            {isUnlocked ? (
              <span className="font-body text-[11px] font-bold text-cinema-muted">{formatTime(item.durationSeconds)}</span>
            ) : (
              <AccessLockCaption status={status} />
            )}
          </div>
        </div>

        {isUnlocked ? (
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(135deg, #2D65AE, #4799C1)", boxShadow: "0 4px 14px -4px rgba(45,101,174,0.5)" }}
          >
            {isExpanded && !playerReady ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
            ) : isPlaying ? (
              <Pause className="h-3.5 w-3.5 fill-current text-white" />
            ) : (
              <Play className="ml-0.5 h-3.5 w-3.5 fill-current text-white" />
            )}
          </div>
        ) : (
          <div className="relative h-9 w-9 flex-shrink-0" />
        )}
      </button>

      <AccessLockBadge status={status} />

      {isExpanded && isUnlocked && (
        <div className="border-t border-cinema-border px-4 pb-4 pt-3">
          {/* Container de tamanho zero: o iframe é criado aqui, mas só o áudio importa */}
          <div ref={containerRef} className="h-0 w-0 overflow-hidden" />
          <div className="mb-2 h-2 cursor-pointer overflow-hidden rounded-full bg-cinema-surface-alt" onClick={handleSeek}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progressPct}%`, background: "linear-gradient(135deg, #2D65AE, #4799C1)" }}
            />
          </div>
          <span className="font-body text-[11px] font-bold text-cinema-muted">
            {formatTime(currentTime)} / {formatTime(item.durationSeconds)}
          </span>
        </div>
      )}
    </div>
  );
}
