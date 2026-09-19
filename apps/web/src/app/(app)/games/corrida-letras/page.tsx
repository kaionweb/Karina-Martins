"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Delete, RotateCcw, Trophy, Zap } from "lucide-react";
import { BrandGlow } from "@/components/decorative/brand-glow";
import { ProfileHeaderBadge } from "@/components/layout/ProfileHeaderBadge";
import { getHighScore, saveHighScoreIfBetter } from "@/lib/games/highscore";
import { LEVEL_STYLES, type Nivel } from "@/lib/ui/levelStyles";

const GAME_ID = "g3";
const LEVEL_ORDER: Nivel[] = ["Básico", "Intermediário", "Avançado"];

// Cor sólida por nível pra tiles/borda/timer — primeiro tom do gradiente de
// cada LEVEL_STYLES, mantendo a mesma paleta usada em Séries/Explorar/Filmes.
const LEVEL_ACCENT: Record<Nivel, string> = {
  Básico: "#2D65AE",
  Intermediário: "#DA233B",
  Avançado: "#1E4A85",
};

interface WordEntry {
  word: string;
  emoji: string;
}

interface LevelConfig {
  time: number;
  words: WordEntry[];
}

const WORD_SETS: Record<Nivel, LevelConfig> = {
  Básico: {
    time: 15,
    words: [
      { word: "CAT", emoji: "🐱" },
      { word: "SUN", emoji: "☀️" },
      { word: "DOG", emoji: "🐶" },
      { word: "BEE", emoji: "🐝" },
    ],
  },
  Intermediário: {
    time: 20,
    words: [
      { word: "HORSE", emoji: "🐴" },
      { word: "APPLE", emoji: "🍎" },
      { word: "HOUSE", emoji: "🏠" },
      { word: "WATER", emoji: "💧" },
    ],
  },
  Avançado: {
    time: 25,
    words: [
      { word: "MOUNTAIN", emoji: "⛰️" },
      { word: "ELEPHANT", emoji: "🐘" },
      { word: "BIRTHDAY", emoji: "🎂" },
      { word: "RAINBOW", emoji: "🌈" },
    ],
  },
};

type RoundStatus = "playing" | "correct" | "timeout" | "finished";

function shuffle(str: string): string[] {
  const arr = str.split("");
  let shuffled: string[];
  do {
    shuffled = [...arr].sort(() => Math.random() - 0.5);
  } while (shuffled.join("") === str && arr.length > 1);
  return shuffled;
}

export default function CorridaLetrasGame() {
  const router = useRouter();
  const [level, setLevel] = useState<Nivel>("Básico");
  const [roundIndex, setRoundIndex] = useState(0);
  const [letters, setLetters] = useState<string[]>(() => shuffle(WORD_SETS.Básico.words[0].word));
  const [answer, setAnswer] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(WORD_SETS.Básico.time);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<RoundStatus>("playing");
  const [highScore, setHighScore] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const config = WORD_SETS[level];
  const accent = LEVEL_ACCENT[level];

  useEffect(() => {
    setHighScore(getHighScore(GAME_ID));
  }, []);

  const current = config.words[roundIndex];
  const isLastRound = roundIndex === config.words.length - 1;

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setStatus("timeout");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roundIndex, level, startTimer]);

  const changeLevel = (newLevel: Nivel) => {
    setLevel(newLevel);
    setRoundIndex(0);
    setLetters(shuffle(WORD_SETS[newLevel].words[0].word));
    setAnswer([]);
    setTimeLeft(WORD_SETS[newLevel].time);
    setScore(0);
    setStatus("playing");
  };

  const nextRound = () => {
    if (isLastRound) {
      setStatus("finished");
      setHighScore(saveHighScoreIfBetter(GAME_ID, score));
      return;
    }
    const next = roundIndex + 1;
    setRoundIndex(next);
    setLetters(shuffle(config.words[next].word));
    setAnswer([]);
    setTimeLeft(config.time);
    setStatus("playing");
  };

  const handleLetterClick = (idx: number) => {
    if (status !== "playing") return;
    if (answer.includes(idx)) return;

    const nextAnswer = [...answer, idx];
    setAnswer(nextAnswer);

    const word = nextAnswer.map((i) => letters[i]).join("");
    if (word === current.word) {
      if (timerRef.current) clearInterval(timerRef.current);
      setScore((s) => s + 20 + timeLeft * 2); // bônus por velocidade
      setStatus("correct");
    }
  };

  const handleBackspace = () => {
    if (status !== "playing") return;
    setAnswer((prev) => prev.slice(0, -1));
  };

  const resetGame = () => changeLevel(level);

  const progressPct = (timeLeft / config.time) * 100;
  const urgent = timeLeft <= 5;

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
            <Zap className="h-5 w-5" style={{ color: "#2D65AE" }} />
            <h1 className="font-display text-2xl font-bold text-cinema-text">Corrida das Letras</h1>
          </div>
          <div className="flex items-start justify-between gap-3">
            <p className="font-body text-sm text-cinema-muted">
              Palavra {roundIndex + 1} de {config.words.length}
            </p>
            <span
              className="mt-1 flex flex-shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-body text-[10px] font-black uppercase tracking-wider"
              style={{ border: "1px solid rgba(251,198,7,0.35)", backgroundColor: "rgba(251,198,7,0.12)", color: "#B8860B" }}
            >
              <Trophy className="h-2.5 w-2.5" />
              {score} pts
            </span>
          </div>
          {highScore > 0 && (
            <p className="mt-1 font-body text-[11px] font-bold text-cinema-muted">Recorde: {highScore} pts</p>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          {LEVEL_ORDER.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => changeLevel(l)}
              className="flex-1 rounded-full border px-3 py-2 font-body text-xs font-bold transition-all"
              style={
                level === l
                  ? { background: LEVEL_STYLES[l].chipBg, color: "#fff", borderColor: "transparent" }
                  : { backgroundColor: "rgb(var(--cinema-surface))", borderColor: "rgb(var(--cinema-border))", color: undefined }
              }
            >
              {l}
            </button>
          ))}
        </div>

        {status !== "finished" && (
          <>
            <div className="mt-5">
              <div className="mb-1.5 flex items-center gap-1">
                <Clock className={`h-3.5 w-3.5 ${urgent ? "animate-pulse" : ""}`} style={{ color: urgent ? "#dc2626" : undefined }} />
                <span
                  className={`font-body text-xs font-bold ${urgent ? "animate-pulse" : ""}`}
                  style={{ color: urgent ? "#dc2626" : undefined }}
                >
                  {timeLeft}s
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-cinema-surface-alt">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${progressPct}%`, backgroundColor: urgent ? "#dc2626" : accent }}
                />
              </div>
            </div>

            <div className="mb-6 mt-6 flex flex-col items-center">
              <span className="mb-4 text-5xl">{current.emoji}</span>
              <div className={`flex flex-wrap justify-center gap-2 ${status === "timeout" ? "animate-shake" : ""}`}>
                {current.word.split("").map((_, i) => (
                  <div
                    key={i}
                    className="flex h-12 w-12 items-center justify-center rounded-xl border-2 font-display text-lg font-bold text-cinema-text"
                    style={{
                      backgroundColor: answer[i] != null ? "rgba(45,101,174,0.1)" : "rgb(var(--cinema-surface))",
                      borderColor: answer[i] != null ? accent : "rgb(var(--cinema-border))",
                    }}
                  >
                    {answer[i] != null ? letters[answer[i]] : ""}
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6 flex flex-wrap justify-center gap-2">
              {letters.map((letter, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleLetterClick(idx)}
                  disabled={answer.includes(idx) || status !== "playing"}
                  className="flex h-12 w-12 items-center justify-center rounded-xl font-display text-lg font-bold text-white transition-transform active:scale-90 disabled:opacity-30"
                  style={{ backgroundColor: accent }}
                >
                  {letter}
                </button>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleBackspace}
                disabled={answer.length === 0 || status !== "playing"}
                className="flex items-center gap-1.5 rounded-full border border-cinema-border bg-cinema-surface px-4 py-2 font-body text-xs font-bold text-cinema-muted disabled:opacity-30"
              >
                <Delete className="h-3.5 w-3.5" />
                Apagar
              </button>
            </div>

            {status === "correct" && (
              <div
                className="mt-6 animate-pop-in rounded-2xl p-4 text-center"
                style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}
              >
                <p className="mb-3 font-display text-base font-bold" style={{ color: "#16a34a" }}>
                  Certinho! 🎉
                </p>
                <button
                  type="button"
                  onClick={nextRound}
                  className="rounded-full px-5 py-2 font-display text-sm font-bold text-white"
                  style={{ background: LEVEL_STYLES[level].chipBg }}
                >
                  {isLastRound ? "Ver resultado" : "Próxima palavra"}
                </button>
              </div>
            )}
            {status === "timeout" && (
              <div
                className="mt-6 animate-pop-in rounded-2xl p-4 text-center"
                style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}
              >
                <p className="mb-1 font-body text-sm font-bold" style={{ color: "#dc2626" }}>
                  Tempo esgotado!
                </p>
                <p className="mb-3 font-body text-xs text-cinema-muted">
                  A palavra era <strong>{current.word}</strong>
                </p>
                <button
                  type="button"
                  onClick={nextRound}
                  className="rounded-full px-5 py-2 font-display text-sm font-bold text-white"
                  style={{ background: LEVEL_STYLES[level].chipBg }}
                >
                  {isLastRound ? "Ver resultado" : "Próxima palavra"}
                </button>
              </div>
            )}
          </>
        )}

        {status === "finished" && (
          <div className="animate-pop-in mt-6 rounded-2xl border border-cinema-border bg-cinema-surface p-6 text-center">
            <div className="mb-2 text-4xl">🏆</div>
            <h3 className="mb-1 font-display text-xl font-bold text-cinema-text">Corrida completa!</h3>
            <p className="mb-5 font-body text-sm text-cinema-muted">Você fez {score} pontos</p>
            <button
              type="button"
              onClick={resetGame}
              className="mx-auto flex items-center gap-2 rounded-full bg-cinema-primary px-5 py-2.5 font-display text-sm font-bold text-white"
            >
              <RotateCcw className="h-4 w-4" />
              Jogar de novo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
