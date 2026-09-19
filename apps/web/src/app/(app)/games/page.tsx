"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Gamepad2, Lock, Search, Trophy } from "lucide-react";
import { isTrialActive, trialDaysRemaining } from "@ipp/shared";
import { BrandGlow } from "@/components/decorative/brand-glow";
import { ProfileHeaderBadge } from "@/components/layout/ProfileHeaderBadge";
import { AccessLockBadge } from "@/components/access-control/AccessLock";
import { TrialBanner } from "@/components/access-control/TrialBanner";
import { getHighScore } from "@/lib/games/highscore";
import { useProfileStore } from "@/stores/useProfileStore";
import { checkIsAdmin } from "@/lib/api/admin";
import { gamesMock, type MockGame } from "../_mock/content";

// Rota de cada jogo já implementado. Os jogos sem entrada aqui continuam
// bloqueados (ver MockGame.bloqueado) até ganharem uma tela própria.
const GAME_ROUTES: Record<string, string> = {
  g1: "/games/caca-palavras",
  g2: "/games/memoria-animais",
  g3: "/games/corrida-letras",
  g4: "/games/quiz-relampago",
  g5: "/games/pintando-ingles",
  g6: "/games/labirinto-alfabeto",
};

// Jogos que visitante (sem conta) pode jogar de verdade — Parte 2 do modo
// visitante. Eixo independente do `premium` (que só rege a trava de
// trial/premium pra quem já tem conta): decidido pelo produto (Quiz
// Relâmpago + Memória dos Animais — curtos e sem vocabulário avançado), não
// por regra de negócio. Client-only de propósito: jogo não tem tabela no
// Prisma (ver comentário em lib/games/highscore.ts), então não há necessidade
// de campo no banco pra isso.
const FREE_FOR_GUESTS = ["g2", "g4"];

export default function GamesPage() {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [games, setGames] = useState(gamesMock);
  const activeProfile = useProfileStore((state) => state.activeProfile);
  const isAdult = activeProfile?.type === "ADULT";
  const [isAdmin, setIsAdmin] = useState(false);

  // O high score real (localStorage, por navegador) substitui o número
  // ilustrativo do mock assim que o jogador já jogou alguma partida.
  useEffect(() => {
    setGames((prev) =>
      prev.map((game) => {
        if (!GAME_ROUTES[game.id]) return game;
        const real = getHighScore(game.id);
        return real > 0 ? { ...game, highScore: real } : game;
      }),
    );
  }, []);

  useEffect(() => {
    if (!isAdult) {
      setIsAdmin(false);
      return;
    }

    let ativo = true;
    checkIsAdmin().then((result) => {
      if (ativo) setIsAdmin(result);
    });

    return () => {
      ativo = false;
    };
  }, [isAdult]);

  // Sem backend por trás (catálogo 100% mock — ver comentário em
  // _mock/content.ts): a trava aqui é só visual, calculada no client a
  // partir do trial. bypass = admin vendo tudo liberado.
  const trialActive = isTrialActive(activeProfile?.trialStartedAt);
  const bypass = isAdmin;
  const isGuest = !activeProfile;
  const isGameUnlocked = (game: MockGame) => {
    if (isGuest) return FREE_FOR_GUESTS.includes(game.id);
    return bypass || trialActive || !game.premium;
  };
  // Distinto de "premium" (usuário com conta, fora do trial, sem assinatura —
  // não existe fluxo de assinatura ainda, então fica só desabilitado). Pra
  // visitante, o cadeado é um convite de cadastro: o card continua clicável.
  const needsSignup = (game: MockGame) => isGuest && !game.bloqueado && !FREE_FOR_GUESTS.includes(game.id);

  const itens = games.filter((game) => !busca || game.titulo.toLowerCase().includes(busca.toLowerCase()));

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
          <div className="mb-1 flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" style={{ color: "#2D65AE" }} />
            <h1 className="font-display text-2xl font-bold text-cinema-text">Games</h1>
          </div>
          <div className="flex items-start justify-between gap-3">
            <p className="font-body text-sm text-cinema-muted">Aprenda inglês brincando</p>
            <span className="mt-1 flex-shrink-0 rounded-full border border-cinema-border bg-cinema-surface-alt px-2.5 py-1 font-body text-[10px] font-black uppercase tracking-wider text-cinema-muted">
              {gamesMock.length} jogos
            </span>
          </div>
        </div>

        <div className="mt-4">
          <TrialBanner trialActive={trialActive} bypass={bypass} daysLeft={trialDaysRemaining(activeProfile?.trialStartedAt)} />
        </div>

        <div className="mt-5 flex items-center rounded-2xl border border-cinema-border bg-cinema-surface">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center text-cinema-muted">
            <Search className="h-4 w-4" />
          </div>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar jogo…"
            className="h-11 flex-1 bg-transparent pr-3 font-body text-sm font-semibold text-cinema-text placeholder:text-cinema-muted outline-none"
          />
        </div>

        <section className="mb-7 mt-6">
          {itens.length === 0 ? (
            <p className="py-10 text-center font-body text-[13px] text-cinema-muted">Nenhum jogo encontrado.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {itens.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  unlocked={isGameUnlocked(game)}
                  signupLocked={needsSignup(game)}
                  onClick={() => {
                    if (needsSignup(game)) {
                      router.push("/register");
                      return;
                    }
                    const route = GAME_ROUTES[game.id];
                    if (route) router.push(route);
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function GameCard({
  game,
  unlocked,
  signupLocked,
  onClick,
}: {
  game: MockGame;
  unlocked: boolean;
  signupLocked: boolean;
  onClick: () => void;
}) {
  // Três motivos distintos de cadeado — nunca confundir:
  // - bloqueado: jogo sem tela própria ainda (cinza, sempre desabilitado)
  // - premium fora do trial: coroa, desabilitado (não existe fluxo de
  //   assinatura ainda)
  // - signupLocked: visitante sem conta — continua CLICÁVEL, o clique leva
  //   pro cadastro em vez de travar sem explicação (Parte 2, modo visitante)
  const disabled = game.bloqueado || (!unlocked && !signupLocked);
  const isPremiumLocked = !game.bloqueado && !unlocked && !signupLocked;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group relative flex aspect-square w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-3xl border border-cinema-border bg-cinema-surface p-4 text-center transition-transform disabled:cursor-not-allowed"
      style={{ opacity: disabled ? 0.55 : 1 }}
    >
      {!disabled ? (
        <div
          className={`pointer-events-none absolute -inset-8 bg-gradient-to-br ${game.gradiente} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-25`}
        />
      ) : null}

      <div
        className={`relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${game.gradiente} transition-transform ${disabled ? "" : "group-hover:scale-110"}`}
        style={{ boxShadow: disabled ? "none" : "0 10px 24px -8px rgba(0,0,0,0.4)", filter: isPremiumLocked ? "grayscale(0.7) brightness(0.85)" : undefined }}
      >
        {game.bloqueado ? <Lock className="h-6 w-6 text-cinema-muted" /> : <span className="animate-bob text-3xl">{game.emoji}</span>}
      </div>

      {isPremiumLocked && <AccessLockBadge status="locked-premium" />}
      {signupLocked && (
        <div
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-cinema-primary"
          title="Crie uma conta pra jogar"
        >
          <Lock className="h-3 w-3 text-white" />
        </div>
      )}

      <div className="relative">
        <h3 className="font-display text-sm font-bold leading-tight text-cinema-text">{game.titulo}</h3>
        <p className="mt-0.5 font-body text-[10px] font-semibold leading-tight text-cinema-muted">
          {game.bloqueado
            ? "Desbloqueia em breve"
            : signupLocked
              ? "Crie uma conta pra jogar"
              : isPremiumLocked
                ? "Assine o Premium"
                : game.desc}
        </p>
      </div>

      {!disabled && game.highScore > 0 ? (
        <div className="relative flex items-center gap-1 rounded-full px-2 py-0.5" style={{ border: "1px solid rgba(251,198,7,0.35)", backgroundColor: "rgba(251,198,7,0.12)" }}>
          <Trophy className="h-2.5 w-2.5" style={{ color: "#B8860B" }} />
          <span className="font-body text-[9px] font-black" style={{ color: "#B8860B" }}>{game.highScore} pts</span>
        </div>
      ) : null}
    </button>
  );
}
