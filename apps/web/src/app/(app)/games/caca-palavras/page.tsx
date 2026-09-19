"use client";

import { useCallback, useEffect, useState, type TouchEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, RotateCcw, Search, Trophy } from "lucide-react";
import { BrandGlow } from "@/components/decorative/brand-glow";
import { ProfileHeaderBadge } from "@/components/layout/ProfileHeaderBadge";
import { getHighScore, saveHighScoreIfBetter } from "@/lib/games/highscore";
import { LEVEL_STYLES, type Nivel } from "@/lib/ui/levelStyles";

const GAME_ID = "g1";
const LEVEL_ORDER: Nivel[] = ["Básico", "Intermediário", "Avançado"];

interface LevelConfig {
  words: string[];
  gridSize: number;
  points: number;
}

const WORD_SETS: Record<Nivel, LevelConfig> = {
  Básico: { words: ["CAT", "DOG", "SUN", "COW", "BEE"], gridSize: 8, points: 40 },
  Intermediário: { words: ["HORSE", "TIGER", "APPLE", "HOUSE", "WATER"], gridSize: 9, points: 60 },
  Avançado: { words: ["ELEPHANT", "BUTTERFLY", "MOUNTAIN", "DINOSAUR"], gridSize: 11, points: 90 },
};

interface Placement {
  word: string;
  cells: string[];
}

// Gera a grade colocando cada palavra na horizontal ou vertical, sem
// sobreposição conflitante, e preenche o resto com letras aleatórias.
function generateGrid(words: string[], size: number): { grid: string[][]; placements: Placement[] } {
  const grid: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const placements: Placement[] = [];

  for (const word of words) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 150) {
      attempts++;
      const horizontal = Math.random() > 0.5;
      const row = Math.floor(Math.random() * (horizontal ? size : size - word.length));
      const col = Math.floor(Math.random() * (horizontal ? size - word.length : size));

      let fits = true;
      for (let i = 0; i < word.length; i++) {
        const r = horizontal ? row : row + i;
        const c = horizontal ? col + i : col;
        if (grid[r][c] !== null && grid[r][c] !== word[i]) fits = false;
      }

      if (fits) {
        const cells: string[] = [];
        for (let i = 0; i < word.length; i++) {
          const r = horizontal ? row : row + i;
          const c = horizontal ? col + i : col;
          grid[r][c] = word[i];
          cells.push(`${r}-${c}`);
        }
        placements.push({ word, cells });
        placed = true;
      }
    }
  }

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === null) {
        grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }
  }

  return { grid: grid as string[][], placements };
}

export default function CacaPalavrasGame() {
  const router = useRouter();
  const [level, setLevel] = useState<Nivel>("Básico");
  const [{ grid, placements }, setBoard] = useState(() =>
    generateGrid(WORD_SETS.Básico.words, WORD_SETS.Básico.gridSize),
  );
  const [selecting, setSelecting] = useState(false);
  const [selectedCells, setSelectedCells] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const config = WORD_SETS[level];

  useEffect(() => {
    setHighScore(getHighScore(GAME_ID));
  }, []);

  const changeLevel = (newLevel: Nivel) => {
    setLevel(newLevel);
    setBoard(generateGrid(WORD_SETS[newLevel].words, WORD_SETS[newLevel].gridSize));
    setFoundWords([]);
    setScore(0);
    setSelectedCells([]);
  };

  const cellKey = (r: number, c: number) => `${r}-${c}`;
  const isSelected = (r: number, c: number) => selectedCells.includes(cellKey(r, c));
  const isFoundCell = (r: number, c: number) =>
    placements.some((p) => foundWords.includes(p.word) && p.cells.includes(cellKey(r, c)));

  const handleStart = (r: number, c: number) => {
    setSelecting(true);
    setSelectedCells([cellKey(r, c)]);
  };

  const handleEnter = (r: number, c: number) => {
    if (!selecting) return;
    setSelectedCells((prev) => {
      const start = prev[0];
      const [sr, sc] = start.split("-").map(Number);
      // Só permite seleção em linha reta (horizontal ou vertical).
      if (r !== sr && c !== sc) return prev;
      const cells: string[] = [];
      if (r === sr) {
        const [from, to] = sc < c ? [sc, c] : [c, sc];
        for (let i = from; i <= to; i++) cells.push(cellKey(r, i));
      } else {
        const [from, to] = sr < r ? [sr, r] : [r, sr];
        for (let i = from; i <= to; i++) cells.push(cellKey(i, c));
      }
      return cells;
    });
  };

  // Touch não dispara onMouseEnter ao arrastar o dedo entre células — sem isso,
  // só a célula do onTouchStart era registrada. elementFromPoint acha a célula
  // sob o dedo a cada movimento e reaproveita a mesma lógica de handleEnter.
  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!selecting) return;
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    const cell = document.elementFromPoint(touch.clientX, touch.clientY)?.closest<HTMLElement>("[data-row]");
    if (!cell) return;
    const r = Number(cell.dataset.row);
    const c = Number(cell.dataset.col);
    if (Number.isNaN(r) || Number.isNaN(c)) return;
    handleEnter(r, c);
  };

  // Lê `selectedCells`/`config` do closure (não via updater funcional) porque o
  // passo seguinte dispara setFoundWords/setScore como efeito colateral — colocar
  // isso dentro de um updater funcional é impuro e o React (Strict Mode, dev)
  // pode invocá-lo duas vezes, duplicando a pontuação.
  const handleEnd = useCallback(() => {
    setSelecting(false);
    const selectedWord = selectedCells
      .map((k) => {
        const [r, c] = k.split("-").map(Number);
        return grid[r][c];
      })
      .join("");

    const match = placements.find(
      (p) =>
        !foundWords.includes(p.word) &&
        (p.word === selectedWord || p.word === selectedWord.split("").reverse().join("")),
    );

    if (match) {
      const nextFoundWords = [...foundWords, match.word];
      const nextScore = score + config.points;
      setFoundWords(nextFoundWords);
      setScore(nextScore);
      if (nextFoundWords.length === config.words.length) {
        setHighScore(saveHighScoreIfBetter(GAME_ID, nextScore));
      }
    }
    setSelectedCells([]);
  }, [selectedCells, grid, placements, foundWords, score, config]);

  const allFound = foundWords.length === config.words.length;
  const resetGame = () => changeLevel(level);

  return (
    <div
      className="relative min-h-[calc(100vh-96px)] w-full select-none overflow-hidden"
      onMouseUp={handleEnd}
      onTouchEnd={handleEnd}
    >
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
            <Search className="h-5 w-5" style={{ color: "#2D65AE" }} />
            <h1 className="font-display text-2xl font-bold text-cinema-text">Caça-Palavras</h1>
          </div>
          <div className="flex items-start justify-between gap-3">
            <p className="font-body text-sm text-cinema-muted">Arraste pra selecionar as palavras escondidas</p>
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

        <div className="mt-5 flex flex-wrap gap-2">
          {config.words.map((w) => {
            const found = foundWords.includes(w);
            return (
              <span
                key={w}
                className="flex items-center gap-1 rounded-full border px-3 py-1.5 font-body text-xs font-black"
                style={{
                  backgroundColor: found ? "rgba(34,197,94,0.12)" : undefined,
                  borderColor: found ? "rgba(34,197,94,0.35)" : undefined,
                  color: found ? "#16a34a" : undefined,
                  textDecoration: found ? "line-through" : "none",
                }}
              >
                {found && <Check className="h-3 w-3" strokeWidth={3} />}
                {w}
              </span>
            );
          })}
        </div>

        <div
          className="mt-5 grid select-none gap-1 rounded-cinema-md border border-cinema-border bg-cinema-surface p-3"
          style={{ gridTemplateColumns: `repeat(${config.gridSize}, 1fr)`, touchAction: "none" }}
          onTouchMove={handleTouchMove}
        >
          {grid.map((row, r) =>
            row.map((letter, c) => {
              const selected = isSelected(r, c);
              const found = isFoundCell(r, c);
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  data-row={r}
                  data-col={c}
                  onMouseDown={() => handleStart(r, c)}
                  onMouseEnter={() => handleEnter(r, c)}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleStart(r, c);
                  }}
                  className="flex aspect-square items-center justify-center rounded-lg font-display font-bold transition-colors"
                  style={{
                    fontSize: config.gridSize > 9 ? "11px" : "14px",
                    backgroundColor: found ? "rgba(34,197,94,0.15)" : selected ? "rgba(59,130,246,0.15)" : undefined,
                    color: found ? "#16a34a" : selected ? "#2563eb" : undefined,
                  }}
                >
                  {letter}
                </button>
              );
            }),
          )}
        </div>

        {allFound && (
          <div
            className="mt-6 animate-pop-in rounded-2xl p-5 text-center"
            style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}
          >
            <div className="mb-2 text-3xl">🎉</div>
            <h3 className="mb-1 font-display text-lg font-bold" style={{ color: "#16a34a" }}>
              Você encontrou todas!
            </h3>
            <p className="mb-4 font-body text-sm text-cinema-muted">{score} pontos nessa rodada</p>
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
