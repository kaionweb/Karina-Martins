"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Map, RotateCcw, Trophy } from "lucide-react";
import { BrandGlow } from "@/components/decorative/brand-glow";
import { ProfileHeaderBadge } from "@/components/layout/ProfileHeaderBadge";
import { getHighScore, saveHighScoreIfBetter } from "@/lib/games/highscore";
import { LEVEL_STYLES, type Nivel } from "@/lib/ui/levelStyles";

const GAME_ID = "g6";
const LEVEL_ORDER: Nivel[] = ["Básico", "Intermediário", "Avançado"];

// Cor sólida por nível pra setas/moldura — primeiro tom do gradiente de cada
// LEVEL_STYLES, mesma técnica usada na Corrida das Letras.
const LEVEL_ACCENT: Record<Nivel, string> = {
  Básico: "#2D65AE",
  Intermediário: "#DA233B",
  Avançado: "#1E4A85",
};

interface Position {
  row: number;
  col: number;
}

interface LevelConfig {
  gridSize: number;
  sequence: string[];
  start: Position;
  walls: number[][];
  positions: Record<string, Position>;
}

// Básico: colher o alfabeto em ordem (A,B,C,D) num labirinto simples.
// Intermediário: labirinto maior, ainda alfabeto (E,F,G,H,I) com mais paredes.
// Avançado: soletrar uma palavra em ordem (C,A,T) — não é mais o alfabeto, é
// reconhecer a letra certa dentro da sequência de uma palavra.
const LEVEL_SETS: Record<Nivel, LevelConfig> = {
  Básico: {
    gridSize: 5,
    sequence: ["A", "B", "C", "D"],
    start: { row: 4, col: 0 },
    walls: [
      [0, 0, 0, 1, 0],
      [1, 1, 0, 1, 0],
      [0, 0, 0, 0, 0],
      [0, 1, 1, 1, 0],
      [0, 0, 0, 0, 0],
    ],
    positions: { A: { row: 0, col: 0 }, B: { row: 0, col: 4 }, C: { row: 2, col: 2 }, D: { row: 4, col: 4 } },
  },
  Intermediário: {
    gridSize: 6,
    sequence: ["E", "F", "G", "H", "I"],
    start: { row: 5, col: 0 },
    walls: [
      [0, 1, 0, 0, 0, 0],
      [0, 1, 0, 1, 1, 0],
      [0, 0, 0, 0, 1, 0],
      [1, 1, 0, 1, 0, 0],
      [0, 0, 0, 1, 0, 1],
      [0, 1, 0, 0, 0, 0],
    ],
    positions: {
      E: { row: 0, col: 0 },
      F: { row: 0, col: 5 },
      G: { row: 2, col: 3 },
      H: { row: 4, col: 5 },
      I: { row: 5, col: 3 },
    },
  },
  Avançado: {
    gridSize: 6,
    sequence: ["C", "A", "T"],
    start: { row: 5, col: 0 },
    walls: [
      [0, 0, 1, 0, 0, 0],
      [1, 0, 1, 0, 1, 0],
      [0, 0, 0, 0, 1, 0],
      [0, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 0, 1],
      [0, 1, 0, 0, 0, 0],
    ],
    positions: { C: { row: 0, col: 0 }, A: { row: 2, col: 3 }, T: { row: 5, col: 5 } },
  },
};

function canMove(config: LevelConfig, row: number, col: number): boolean {
  if (row < 0 || row >= config.gridSize || col < 0 || col >= config.gridSize) return false;
  return config.walls[row][col] === 0;
}

interface Message {
  type: "error" | "success";
  text: string;
}

export default function LabirintoAlfabetoGame() {
  const router = useRouter();
  const [level, setLevel] = useState<Nivel>("Básico");
  const [playerPos, setPlayerPos] = useState<Position>(LEVEL_SETS.Básico.start);
  const [collected, setCollected] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState<Message | null>(null);
  const [highScore, setHighScore] = useState(0);

  const config = LEVEL_SETS[level];
  const accent = LEVEL_ACCENT[level];

  useEffect(() => {
    setHighScore(getHighScore(GAME_ID));
  }, []);

  const nextLetter = config.sequence[collected.length];
  const isComplete = collected.length === config.sequence.length;

  useEffect(() => {
    if (isComplete) setHighScore(saveHighScoreIfBetter(GAME_ID, score));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  const changeLevel = (newLevel: Nivel) => {
    setLevel(newLevel);
    setPlayerPos(LEVEL_SETS[newLevel].start);
    setCollected([]);
    setScore(0);
    setMessage(null);
  };

  // Lê `playerPos`/`collected`/`config` do closure (não via updater funcional)
  // porque coletar uma letra dispara setCollected/setScore como efeito
  // colateral — aninhar isso dentro do updater de setPlayerPos é impuro e
  // duplicaria a pontuação sob Strict Mode (dev), igual ao bug já corrigido
  // no Caça-Palavras.
  const move = useCallback(
    (dRow: number, dCol: number) => {
      if (isComplete) return;
      const next = { row: playerPos.row + dRow, col: playerPos.col + dCol };
      if (!canMove(config, next.row, next.col)) return;
      setPlayerPos(next);

      const letterHere = Object.entries(config.positions).find(([, pos]) => pos.row === next.row && pos.col === next.col);
      if (letterHere) {
        const [letter] = letterHere;
        if (!collected.includes(letter)) {
          if (letter === config.sequence[collected.length]) {
            setCollected((c) => [...c, letter]);
            setScore((s) => s + 25);
            setMessage({ type: "success", text: `Boa! Letra ${letter} coletada.` });
          } else {
            setMessage({ type: "error", text: `Ainda não! Procure a letra ${config.sequence[collected.length]} primeiro.` });
          }
          setTimeout(() => setMessage(null), 1500);
        }
      }
    },
    [playerPos, collected, isComplete, config],
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") move(-1, 0);
      if (e.key === "ArrowDown") move(1, 0);
      if (e.key === "ArrowLeft") move(0, -1);
      if (e.key === "ArrowRight") move(0, 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [move]);

  const resetGame = () => changeLevel(level);

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
            <Map className="h-5 w-5" style={{ color: "#2D65AE" }} />
            <h1 className="font-display text-2xl font-bold text-cinema-text">Labirinto do Alfabeto</h1>
          </div>
          <div className="flex items-start justify-between gap-3">
            <p className="font-body text-sm text-cinema-muted">
              {isComplete ? (
                "Você completou a sequência!"
              ) : level === "Avançado" ? (
                <>
                  Encontre as letras de <strong style={{ color: accent }}>CAT</strong> em ordem
                </>
              ) : (
                <>
                  Encontre a letra <strong style={{ color: accent }}>{nextLetter}</strong> em ordem
                </>
              )}
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

        <div className="mt-4 flex gap-2">
          {config.sequence.map((letter) => {
            const done = collected.includes(letter);
            const isNext = letter === nextLetter && !done;
            return (
              <div
                key={letter}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 font-display text-base font-bold ${isNext ? "animate-bounce" : ""}`}
                style={{
                  backgroundColor: done ? "rgba(34,197,94,0.15)" : isNext ? "rgba(45,101,174,0.15)" : "rgb(var(--cinema-surface))",
                  borderColor: done ? "#22c55e" : isNext ? accent : "rgb(var(--cinema-border))",
                  color: done ? "#16a34a" : isNext ? accent : "rgb(var(--cinema-muted))",
                }}
              >
                {letter}
              </div>
            );
          })}
        </div>

        {message && (
          <div
            className="animate-fade-in-sm mb-3 mt-3 rounded-xl px-3 py-2 text-center font-body text-xs font-bold"
            style={{
              backgroundColor: message.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              color: message.type === "success" ? "#16a34a" : "#dc2626",
            }}
          >
            {message.text}
          </div>
        )}

        <div className="mt-5 rounded-cinema-md border border-cinema-border bg-cinema-surface p-3">
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${config.gridSize}, 1fr)` }}>
            {config.walls.map((rowArr, r) =>
              rowArr.map((cell, c) => {
                const isWall = cell === 1;
                const isPlayer = playerPos.row === r && playerPos.col === c;
                const letterHere = Object.entries(config.positions).find(([, p]) => p.row === r && p.col === c);
                const letterCollected = letterHere && collected.includes(letterHere[0]);

                return (
                  <div
                    key={`${r}-${c}`}
                    className="flex aspect-square items-center justify-center rounded-md"
                    style={{ backgroundColor: isWall ? "#CBD5E1" : "rgb(var(--cinema-bg))" }}
                  >
                    {isPlayer ? (
                      <span className="text-lg">🦊</span>
                    ) : letterHere && !letterCollected ? (
                      <span className="font-display text-sm font-bold" style={{ color: accent }}>
                        {letterHere[0]}
                      </span>
                    ) : letterHere && letterCollected ? (
                      <span className="text-xs" style={{ color: "#22c55e" }}>
                        ✓
                      </span>
                    ) : null}
                  </div>
                );
              }),
            )}
          </div>
        </div>

        {!isComplete && (
          <div className="mx-auto mt-5 grid w-40 grid-cols-3 grid-rows-2 gap-2">
            <div />
            <button
              type="button"
              onClick={() => move(-1, 0)}
              className="flex aspect-square items-center justify-center rounded-xl"
              style={{ backgroundColor: accent }}
            >
              <ArrowUp className="h-5 w-5 text-white" />
            </button>
            <div />
            <button
              type="button"
              onClick={() => move(0, -1)}
              className="flex aspect-square items-center justify-center rounded-xl"
              style={{ backgroundColor: accent }}
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <button
              type="button"
              onClick={() => move(1, 0)}
              className="flex aspect-square items-center justify-center rounded-xl"
              style={{ backgroundColor: accent }}
            >
              <ArrowDown className="h-5 w-5 text-white" />
            </button>
            <button
              type="button"
              onClick={() => move(0, 1)}
              className="flex aspect-square items-center justify-center rounded-xl"
              style={{ backgroundColor: accent }}
            >
              <ArrowRight className="h-5 w-5 text-white" />
            </button>
          </div>
        )}

        {isComplete && (
          <div
            className="mt-5 animate-pop-in rounded-2xl p-5 text-center"
            style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}
          >
            <div className="mb-2 text-3xl">🏆</div>
            <h3 className="mb-1 font-display text-lg font-bold" style={{ color: "#16a34a" }}>
              Sequência completa!
            </h3>
            <p className="mb-4 font-body text-sm text-cinema-muted">{score} pontos nessa jornada</p>
            <button
              type="button"
              onClick={resetGame}
              className="mx-auto flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-bold text-white"
              style={{ background: LEVEL_STYLES[level].chipBg }}
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
