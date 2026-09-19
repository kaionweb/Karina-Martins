"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, RotateCcw, Trophy, X, Zap } from "lucide-react";
import { BrandGlow } from "@/components/decorative/brand-glow";
import { ProfileHeaderBadge } from "@/components/layout/ProfileHeaderBadge";
import { GuestSignupPrompt } from "@/components/access-control/GuestSignupPrompt";
import { useProfileStore } from "@/stores/useProfileStore";
import { getHighScore, saveHighScoreIfBetter } from "@/lib/games/highscore";
import { LEVEL_STYLES, type Nivel } from "@/lib/ui/levelStyles";

const GAME_ID = "g4";
const LEVEL_ORDER: Nivel[] = ["Básico", "Intermediário", "Avançado"];

interface Question {
  emoji: string;
  prompt: string;
  options: string[];
  answer: string;
}

interface LevelConfig {
  time: number;
  questions: Question[];
}

const QUESTION_SETS: Record<Nivel, LevelConfig> = {
  Básico: {
    time: 8,
    questions: [
      { emoji: "🐱", prompt: 'Como se diz "gato" em inglês?', options: ["Cat", "Dog", "Cow"], answer: "Cat" },
      { emoji: "☀️", prompt: 'Como se diz "sol" em inglês?', options: ["Moon", "Sun", "Star"], answer: "Sun" },
      { emoji: "🔴", prompt: 'Como se diz "vermelho" em inglês?', options: ["Blue", "Red", "Green"], answer: "Red" },
      { emoji: "3️⃣", prompt: 'Como se diz "três" em inglês?', options: ["Two", "Four", "Three"], answer: "Three" },
    ],
  },
  Intermediário: {
    time: 7,
    questions: [
      { emoji: "🏃", prompt: 'O que significa o verbo "to run"?', options: ["Andar", "Correr", "Pular"], answer: "Correr" },
      { emoji: "🌙", prompt: 'Como se diz "ontem" em inglês?', options: ["Today", "Yesterday", "Tomorrow"], answer: "Yesterday" },
      { emoji: "👨‍👩‍👧", prompt: 'Qual é o plural de "child"?', options: ["Childs", "Children", "Childes"], answer: "Children" },
      { emoji: "🕐", prompt: 'Como se diz "meia hora" em inglês?', options: ["Half hour", "Half time", "Mid hour"], answer: "Half hour" },
    ],
  },
  Avançado: {
    time: 6,
    questions: [
      { emoji: "🤔", prompt: 'Qual é um sinônimo de "happy" em inglês?', options: ["Sad", "Joyful", "Tired"], answer: "Joyful" },
      { emoji: "📖", prompt: 'Complete: "She ___ to school every day."', options: ["go", "goes", "going"], answer: "goes" },
      { emoji: "🔄", prompt: 'Qual é o passado de "to go"?', options: ["Goed", "Went", "Gone"], answer: "Went" },
      { emoji: "❓", prompt: "Qual pergunta está correta?", options: ["What you like?", "What do you like?", "What you doing like?"], answer: "What do you like?" },
    ],
  },
};

type QuizStatus = "playing" | "correct" | "wrong" | "timeout" | "finished";

export default function QuizRelampagoGame() {
  const router = useRouter();
  const isGuest = !useProfileStore((state) => state.activeProfile);
  const [level, setLevel] = useState<Nivel>("Básico");
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_SETS.Básico.time);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<QuizStatus>("playing");
  const [highScore, setHighScore] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const config = QUESTION_SETS[level];

  useEffect(() => {
    setHighScore(getHighScore(GAME_ID));
  }, []);

  const current = config.questions[index];
  const isLast = index === config.questions.length - 1;

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setStatus((s) => (s === "playing" ? "timeout" : s));
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
  }, [index, level, startTimer]);

  const changeLevel = (newLevel: Nivel) => {
    setLevel(newLevel);
    setIndex(0);
    setSelected(null);
    setTimeLeft(QUESTION_SETS[newLevel].time);
    setScore(0);
    setStatus("playing");
  };

  const handleAnswer = (option: string) => {
    if (status !== "playing") return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelected(option);
    if (option === current.answer) {
      setScore((s) => s + 10 + timeLeft * 3);
      setStatus("correct");
    } else {
      setStatus("wrong");
    }
  };

  const next = () => {
    if (isLast) {
      setStatus("finished");
      setHighScore(saveHighScoreIfBetter(GAME_ID, score));
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setTimeLeft(config.time);
    setStatus("playing");
  };

  const resetGame = () => changeLevel(level);

  const urgent = timeLeft <= 3 && status === "playing";

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
            <Zap className="h-5 w-5" style={{ color: "#a855f7" }} />
            <h1 className="font-display text-2xl font-bold text-cinema-text">Quiz Relâmpago</h1>
          </div>
          {status !== "finished" && (
            <div className="flex items-start justify-between gap-3">
              <p className="font-body text-sm text-cinema-muted">
                Pergunta {index + 1} de {config.questions.length}
              </p>
              <span
                className="mt-1 flex flex-shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-body text-[10px] font-black uppercase tracking-wider"
                style={{ border: "1px solid rgba(251,198,7,0.35)", backgroundColor: "rgba(251,198,7,0.12)", color: "#B8860B" }}
              >
                <Trophy className="h-2.5 w-2.5" />
                {score} pts
              </span>
            </div>
          )}
          {highScore > 0 && status !== "finished" && (
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

        {status !== "finished" ? (
          <>
            <div className="mt-5">
              <span className={`font-body text-xs font-bold ${urgent ? "animate-pulse" : ""}`} style={{ color: urgent ? "#dc2626" : undefined }}>
                {timeLeft}s
              </span>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cinema-surface-alt">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${(timeLeft / config.time) * 100}%`, backgroundColor: urgent ? "#dc2626" : "#a855f7" }}
                />
              </div>
            </div>

            <div
              className={`mt-6 rounded-cinema-md border border-cinema-border bg-cinema-surface p-6 text-center ${status === "wrong" ? "animate-shake" : ""}`}
            >
              <span className="mb-3 block text-5xl">{current.emoji}</span>
              <p className="font-display text-base font-bold text-cinema-text">{current.prompt}</p>
            </div>

            <div className="mt-6 space-y-2.5">
              {current.options.map((opt) => {
                const isCorrectOpt = opt === current.answer;
                const isSelectedOpt = opt === selected;
                let bg: string | undefined;
                let border: string | undefined;
                let color: string | undefined;

                if (status !== "playing") {
                  if (isCorrectOpt) {
                    bg = "rgba(34,197,94,0.1)";
                    border = "rgba(34,197,94,0.4)";
                    color = "#16a34a";
                  } else if (isSelectedOpt) {
                    bg = "rgba(239,68,68,0.1)";
                    border = "rgba(239,68,68,0.4)";
                    color = "#dc2626";
                  }
                }

                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleAnswer(opt)}
                    disabled={status !== "playing"}
                    className="flex w-full items-center justify-between rounded-xl border-2 border-cinema-border bg-cinema-surface px-4 py-3 font-display text-sm font-bold text-cinema-text transition-transform active:scale-[0.98]"
                    style={{ backgroundColor: bg, borderColor: border, color }}
                  >
                    {opt}
                    {status !== "playing" && isCorrectOpt && <Check className="h-4 w-4" style={{ color: "#16a34a" }} strokeWidth={3} />}
                    {status !== "playing" && isSelectedOpt && !isCorrectOpt && <X className="h-4 w-4" style={{ color: "#dc2626" }} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>

            {status !== "playing" && (
              <div className="mt-5 animate-pop-in text-center">
                {status === "timeout" && (
                  <p className="mb-3 font-body text-sm font-bold" style={{ color: "#dc2626" }}>
                    Tempo esgotado!
                  </p>
                )}
                <button
                  type="button"
                  onClick={next}
                  className="rounded-full px-5 py-2.5 font-display text-sm font-bold text-white"
                  style={{ background: LEVEL_STYLES[level].chipBg }}
                >
                  {isLast ? "Ver resultado" : "Próxima pergunta"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="mt-5 animate-pop-in rounded-2xl border border-cinema-border bg-cinema-surface p-6 text-center">
            <div className="mb-2 text-4xl">⚡</div>
            <h3 className="mb-1 font-display text-xl font-bold text-cinema-text">Quiz completo!</h3>
            <p className="mb-5 font-body text-sm text-cinema-muted">Você fez {score} pontos</p>
            <button
              type="button"
              onClick={resetGame}
              className="mx-auto flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-bold text-white"
              style={{ background: LEVEL_STYLES[level].chipBg }}
            >
              <RotateCcw className="h-4 w-4" />
              Jogar de novo
            </button>
            {isGuest && <GuestSignupPrompt />}
          </div>
        )}
      </div>
    </div>
  );
}
