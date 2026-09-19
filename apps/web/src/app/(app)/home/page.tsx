"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronRight, Crown, Flame, Lock, Medal, Play, Star, Trophy } from "lucide-react";
import { ProgressBar, StatCard } from "@ipp/ui";
import { deriveLevel, LEVEL_XP_STEP, type ContinueLearningResponse, type RankingResponse, type Show } from "@ipp/shared";
import { useProfileStore } from "@/stores/useProfileStore";
import { getBadges, getRanking, getXpTotal } from "@/lib/api/gamification";
import { getContinueLearning, listShows } from "@/lib/api/catalog";
import { useShowUnlock } from "@/lib/progression/useShowUnlock";
import { gradientForIndex } from "@/lib/ui/posterGradients";
import { avatarForProfile, useAvatarPhoto } from "@/lib/ui/profileAvatar";
import { BrandGlow } from "@/components/decorative/brand-glow";
import { categorias } from "../_mock/content";

export default function AppHomePage() {
  const router = useRouter();
  const activeProfile = useProfileStore((state) => state.activeProfile);
  const nickname = activeProfile?.nickname ?? "";
  const streak = activeProfile?.currentStreak ?? 0;
  const avatar = activeProfile && activeProfile.type === "CHILD" ? avatarForProfile(activeProfile.id) : null;
  const isAdult = activeProfile?.type === "ADULT";
  const { hasPhoto, onError: onPhotoError } = useAvatarPhoto(isAdult ? activeProfile?.avatarUrl : null);

  // XP total, contagem de medalhas e ranking (GET /gamification/xp + /badges + /ranking).
  // Buscados juntos: todos alimentam a seção de gamificação e dependem do perfil ativo.
  const [xpTotal, setXpTotal] = useState<number | null>(null);
  const [badgeCount, setBadgeCount] = useState<number | null>(null);
  const [ranking, setRanking] = useState<RankingResponse | null>(null);
  const [gamiLoading, setGamiLoading] = useState(true);
  const [gamiErro, setGamiErro] = useState(false);

  // Trilhas em destaque (GET /catalog/shows) — seção independente: uma falha aqui
  // não afeta a exibição de XP/medalhas, e vice-versa.
  const [shows, setShows] = useState<Show[]>([]);
  const [showsLoading, setShowsLoading] = useState(true);
  const [showsErro, setShowsErro] = useState(false);
  const { isShowUnlocked } = useShowUnlock(shows);

  // Continuar aprendendo (GET /lessons/continue-learning) — última lição acessada.
  // Seção não-crítica: em erro, o card é ocultado silenciosamente (Story 10.3).
  const [continueLearning, setContinueLearning] = useState<ContinueLearningResponse | null>(null);
  const [clLoading, setClLoading] = useState(true);
  const [clErro, setClErro] = useState(false);

  useEffect(() => {
    let ativo = true;
    setGamiLoading(true);
    setGamiErro(false);

    Promise.all([getXpTotal(), getBadges(), getRanking()])
      .then(([xp, badges, rankingRes]) => {
        if (!ativo) return;
        setXpTotal(xp.total);
        setBadgeCount(badges.length);
        setRanking(rankingRes);
      })
      .catch(() => {
        if (ativo) setGamiErro(true);
      })
      .finally(() => {
        if (ativo) setGamiLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    let ativo = true;
    setShowsLoading(true);
    setShowsErro(false);

    listShows()
      .then((res) => {
        if (ativo) setShows(res);
      })
      .catch(() => {
        if (ativo) setShowsErro(true);
      })
      .finally(() => {
        if (ativo) setShowsLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    let ativo = true;
    setClLoading(true);
    setClErro(false);

    getContinueLearning()
      .then((res) => {
        if (ativo) setContinueLearning(res);
      })
      .catch(() => {
        if (ativo) setClErro(true);
      })
      .finally(() => {
        if (ativo) setClLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  // Enquanto carrega: "…"; em erro: "—"; senão o valor real.
  const xpDisplay = gamiLoading ? "…" : gamiErro ? "—" : (xpTotal ?? 0).toLocaleString("pt-BR");
  const medalhasDisplay = gamiLoading ? "…" : gamiErro ? "—" : String(badgeCount ?? 0);

  // Nível e progresso derivados do XP já buscado (função pura de @ipp/shared) —
  // sem chamada de API adicional e sem rótulo de faixa (Story 10.2).
  const levelInfo = deriveLevel(xpTotal ?? 0);
  const xpIntoLevel = (xpTotal ?? 0) % LEVEL_XP_STEP;
  const xpIntoLevelDisplay = gamiLoading ? "…" : gamiErro ? "—" : String(xpIntoLevel);
  const xpToNextDisplay = gamiLoading ? "…" : gamiErro ? "—" : String(LEVEL_XP_STEP - xpIntoLevel);

  // Ranking real: posição do perfil no ranking entre perfis CHILD.
  // position === null (perfil ADULT) ou seção em erro/carregando → fallback "—".
  const rankingDisplay =
    gamiLoading || gamiErro || ranking?.position == null ? "—" : `${ranking.position}º`;

  return (
    <div className="relative overflow-hidden">
      <BrandGlow />

      <div className="relative z-10 px-5 pt-6">
        {/* header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br shadow-lg ring-2 ring-white/20 ${avatar ? avatar.gradient : "from-cinema-amber to-cinema-primary"}`}
            >
              {hasPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeProfile?.avatarUrl ?? undefined}
                  alt={nickname}
                  className="h-full w-full object-cover"
                  onError={onPhotoError}
                />
              ) : avatar ? (
                <span className="text-2xl">{avatar.emoji}</span>
              ) : (
                <span className="font-display text-lg font-bold text-white">{nickname.charAt(0).toUpperCase() || "?"}</span>
              )}
            </div>
            <div>
              <div className="font-display text-lg font-semibold leading-none text-cinema-text">
                Olá, {nickname}! <span className="inline-block animate-bob" aria-hidden>👋</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-full border border-cinema-amber/30 bg-cinema-amber/15 px-2 py-0.5">
                  <Crown className="h-3 w-3 text-cinema-amber" />
                  <span className="font-body text-[10px] font-black tracking-wide text-cinema-amber">NÍVEL {levelInfo.level}</span>
                </div>
                <div
                  className={`flex items-center gap-1 rounded-full border px-2 py-0.5 ${
                    streak > 0 ? "border-cinema-primary/30 bg-cinema-primary/15" : "border-cinema-border bg-cinema-surface"
                  }`}
                >
                  <Flame className={`h-3 w-3 ${streak > 0 ? "text-cinema-primary-alt" : "text-cinema-muted"}`} />
                  <span
                    className={`font-body text-[10px] font-black tracking-wide ${streak > 0 ? "text-cinema-primary-alt" : "text-cinema-muted"}`}
                  >
                    {streak > 0 ? `${streak} DIAS` : "COMECE HOJE"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            aria-label="Notificações"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-cinema-border bg-cinema-surface"
          >
            <Bell className="h-4 w-4 text-cinema-muted" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cinema-primary ring-2 ring-cinema-bg" />
          </button>
        </div>

        {/* progresso — XP até o próximo nível */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-body text-xs font-bold uppercase tracking-wider text-cinema-muted">Progresso</span>
            <span className="font-body text-xs font-bold text-cinema-text">
              {xpIntoLevelDisplay} / {LEVEL_XP_STEP} XP
            </span>
          </div>
          <ProgressBar value={levelInfo.progressPercent} />
          <div className="mt-1.5 font-body text-[11px] text-cinema-muted">
            Faltam <span className="font-extrabold text-cinema-amber">{xpToNextDisplay} XP</span> pro Nível{" "}
            {levelInfo.level + 1}
          </div>
        </div>

        {/* continue aprendendo */}
        {clErro ? null : (
          <div className="mt-8">
            <h2 className="mb-3 font-display text-lg font-bold text-cinema-text">Continue de onde parou</h2>

            {clLoading || !continueLearning ? (
              <div
                className="relative h-44 overflow-hidden rounded-3xl p-5 shadow-cinema-glow"
                style={{ background: gradientForIndex(0) }}
              >
                <ContinueCardDecor avatar={null} />
                <div className="relative font-display text-2xl font-bold text-white">Continuar aprendendo</div>
                <p className="relative font-body text-sm font-semibold text-white/85">Carregando…</p>
              </div>
            ) : continueLearning.hasProgress ? (
              <button
                type="button"
                className="group relative w-full overflow-hidden rounded-3xl text-left shadow-cinema-glow transition-transform duration-300 hover:scale-[1.02] active:scale-[0.99]"
              >
                <div className="relative flex h-44 flex-col justify-between p-5" style={{ background: gradientForIndex(0) }}>
                  <ContinueCardDecor avatar={avatar} />

                  <div className="relative">
                    <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-black/25 px-2 py-0.5 backdrop-blur-sm">
                      <span className="font-body text-[10px] font-black uppercase tracking-wider text-white">
                        Lição {continueLearning.lessonPosition} de {continueLearning.totalLessonsInTrack}
                      </span>
                    </div>
                    <h3 className="font-display text-3xl font-bold text-white">{continueLearning.lessonTitle}</h3>
                    <p className="font-body text-sm font-semibold text-white/85">{continueLearning.trackTitle}</p>
                  </div>

                  <div className="relative max-w-[70%]">
                    <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-black/25">
                      <div
                        className="h-full rounded-full bg-white"
                        style={{ width: `${continueLearning.trackProgressPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white transition-transform group-hover:scale-110">
                        <Play className="h-3.5 w-3.5 fill-cinema-primary text-cinema-primary" />
                      </div>
                      <span className="font-body text-xs font-black uppercase tracking-wider text-white">
                        Continuar · {continueLearning.trackProgressPercent}%
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ) : (
              <Link
                href="/explorar"
                className="group relative block h-44 overflow-hidden rounded-3xl p-5 shadow-cinema-glow transition-transform duration-300 hover:scale-[1.02]"
                style={{ background: gradientForIndex(0) }}
              >
                <ContinueCardDecor avatar={avatar} />
                <div className="relative flex h-full flex-col justify-between">
                  <div>
                    <h3 className="font-display text-3xl font-bold text-white">Comece sua jornada</h3>
                    <p className="font-body text-sm font-semibold text-white/85">
                      Explore o catálogo e escolha sua primeira lição.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white transition-transform group-hover:scale-110">
                      <Play className="h-3.5 w-3.5 fill-cinema-primary text-cinema-primary" />
                    </div>
                    <span className="font-body text-xs font-black uppercase tracking-wider text-white">
                      Explorar catálogo
                    </span>
                  </div>
                </div>
              </Link>
            )}
          </div>
        )}

        {/* categorias */}
        <div className="mt-8">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-lg font-bold text-cinema-text">Explorar</h2>
            <button type="button" className="flex items-center gap-0.5 font-body text-xs font-bold text-cinema-muted">
              Ver todas <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
            {categorias.map((categoria, index) => (
              <button
                key={categoria.nome}
                type="button"
                onClick={() => {
                  if (categoria.nome === "Séries") router.push("/series");
                  if (categoria.nome === "Filmes") router.push("/filmes");
                  if (categoria.nome === "Conversação") router.push("/conversacao");
                  if (categoria.nome === "Listening") router.push("/listening");
                  if (categoria.nome === "Pronúncia") router.push("/pronuncia");
                  if (categoria.nome === "Premium") router.push("/premium");
                }}
                className="group flex flex-col items-center gap-1.5 focus:outline-none"
              >
                <div
                  className="flex aspect-square w-full items-center justify-center rounded-2xl shadow-lg transition-all duration-300 group-hover:-rotate-3 group-hover:scale-110"
                  style={{ background: gradientForIndex(index), boxShadow: `0 8px 20px -8px ${categoria.cor}66` }}
                >
                  <categoria.icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-display text-[11px] font-semibold text-cinema-text">{categoria.nome}</span>
              </button>
            ))}
          </div>
        </div>

        {/* trilhas em destaque */}
        <div className="mt-8">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-lg font-bold text-cinema-text">Trilhas pra você</h2>
            <button type="button" className="flex items-center gap-0.5 font-body text-xs font-bold text-cinema-muted">
              Ver todas <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          {showsLoading ? (
            <p className="font-body text-[13px] text-cinema-muted">Carregando trilhas…</p>
          ) : showsErro ? (
            <p className="font-body text-[13px] text-cinema-muted">Não foi possível carregar as trilhas.</p>
          ) : shows.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {shows.map((show, index) => {
                const unlocked = isShowUnlocked(index);
                return (
                  <button
                    key={show.id}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => router.push(`/catalog/${show.id}`)}
                    className="group relative flex h-48 w-56 shrink-0 flex-col justify-between overflow-hidden rounded-3xl p-4 text-left transition-transform enabled:hover:scale-[1.03] disabled:cursor-not-allowed"
                  >
                    <div
                      className="absolute inset-0"
                      style={{ background: gradientForIndex(index), filter: unlocked ? undefined : "grayscale(0.7) brightness(0.7)" }}
                    />
                    {unlocked && <div className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/15 blur-2xl" />}
                    <div className="pointer-events-none absolute -left-4 -top-4 h-20 w-20 rounded-full bg-white/10 blur-xl" />

                    {!unlocked && (
                      <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/40 backdrop-blur-sm">
                        <Lock className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}

                    <div className="relative mt-auto">
                      <h3 className="mb-1 font-display text-xl font-bold leading-tight text-white">{show.title}</h3>
                      <p className="font-body text-xs text-white/90">
                        {unlocked ? show.synopsis : `Termine "${shows[0]?.title}" pra desbloquear`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* jornada */}
        <div className="mb-7 mt-8">
          <h2 className="mb-4 font-display text-lg font-bold text-cinema-text">Sua jornada</h2>
          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-cinema-border bg-cinema-surface p-4">
            <StatCard layout="inline" label="XP total" value={xpDisplay} icon={<Star size={19} className="text-cinema-amber" />} />
            <StatCard
              layout="inline"
              bordered
              label="Medalhas"
              value={medalhasDisplay}
              icon={<Medal size={19} className="text-cinema-primary-alt" />}
            />
            <StatCard layout="inline" bordered label="Ranking" value={rankingDisplay} icon={<Trophy size={19} className="text-cinema-blue" />} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Formas ambiente + mascote do perfil (se CHILD) sobre o card "continuar
// aprendendo" — puramente decorativo, não depende do conteúdo da lição.
function ContinueCardDecor({ avatar }: { avatar: { emoji: string; gradient: string } | null }) {
  return (
    <>
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-yellow-300/20 blur-2xl" />
      {avatar ? (
        <div className="pointer-events-none absolute bottom-3 right-3 flex h-16 w-16 animate-float-a items-center justify-center rounded-full bg-white/20 ring-4 ring-white/10 backdrop-blur-sm">
          <span className="text-3xl">{avatar.emoji}</span>
        </div>
      ) : null}
    </>
  );
}
