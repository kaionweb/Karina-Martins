"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Palette, RotateCcw, Trophy } from "lucide-react";
import { BrandGlow } from "@/components/decorative/brand-glow";
import { ProfileHeaderBadge } from "@/components/layout/ProfileHeaderBadge";
import { getHighScore, saveHighScoreIfBetter } from "@/lib/games/highscore";
import { LEVEL_STYLES, type Nivel } from "@/lib/ui/levelStyles";

const GAME_ID = "g5";
const LEVEL_ORDER: Nivel[] = ["Básico", "Intermediário", "Avançado"];

interface ColorOption {
  name: string;
  pt: string;
  hex: string;
}

// Básico: cores simples e diretas. Intermediário: cores um pouco menos óbvias,
// ainda uma palavra só. Avançado: cores compostas (2 palavras) — desafio real
// de vocabulário.
const COLOR_SETS: Record<Nivel, ColorOption[]> = {
  Básico: [
    { name: "Red", pt: "Vermelho", hex: "#ef4444" },
    { name: "Blue", pt: "Azul", hex: "#3b82f6" },
    { name: "Yellow", pt: "Amarelo", hex: "#fbbf24" },
    { name: "Green", pt: "Verde", hex: "#22c55e" },
  ],
  Intermediário: [
    { name: "Purple", pt: "Roxo", hex: "#a855f7" },
    { name: "Orange", pt: "Laranja", hex: "#f97316" },
    { name: "Pink", pt: "Rosa", hex: "#ec4899" },
    { name: "Brown", pt: "Marrom", hex: "#92400e" },
    { name: "Gray", pt: "Cinza", hex: "#6b7280" },
    { name: "Black", pt: "Preto", hex: "#1f2937" },
  ],
  Avançado: [
    { name: "Light Blue", pt: "Azul claro", hex: "#7dd3fc" },
    { name: "Dark Green", pt: "Verde escuro", hex: "#166534" },
    { name: "Turquoise", pt: "Turquesa", hex: "#14b8a6" },
    { name: "Magenta", pt: "Magenta", hex: "#d946ef" },
    { name: "Golden", pt: "Dourado", hex: "#ca8a04" },
    { name: "Navy Blue", pt: "Azul marinho", hex: "#1e3a8a" },
  ],
};

// Regiões de um foguete simples — cada uma é uma parte a pintar.
const REGIONS = ["nose", "body", "window", "finLeft", "finRight", "flame"];

export default function PintandoInglesGame() {
  const router = useRouter();
  const [level, setLevel] = useState<Nivel>("Básico");
  const [selectedColor, setSelectedColor] = useState<ColorOption>(COLOR_SETS.Básico[0]);
  const [fills, setFills] = useState<Record<string, string>>({});
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const colors = COLOR_SETS[level];

  useEffect(() => {
    setHighScore(getHighScore(GAME_ID));
  }, []);

  const paintedCount = Object.keys(fills).length;
  const isComplete = paintedCount === REGIONS.length;

  useEffect(() => {
    if (isComplete) setHighScore(saveHighScoreIfBetter(GAME_ID, score));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  const changeLevel = (newLevel: Nivel) => {
    setLevel(newLevel);
    setSelectedColor(COLOR_SETS[newLevel][0]);
    setFills({});
    setScore(0);
  };

  const paintRegion = (regionId: string) => {
    const alreadyPainted = fills[regionId] != null;
    setFills((prev) => ({ ...prev, [regionId]: selectedColor.hex }));
    if (!alreadyPainted) setScore((s) => s + 15);
  };

  const resetGame = () => {
    setFills({});
    setScore(0);
  };

  const colorOf = (id: string, fallback: string) => fills[id] || fallback;

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
            <Palette className="h-5 w-5" style={{ color: "#ec4899" }} />
            <h1 className="font-display text-2xl font-bold text-cinema-text">Pintando em Inglês</h1>
          </div>
          <div className="flex items-start justify-between gap-3">
            <p className="font-body text-sm text-cinema-muted">Escolha uma cor e toque nas partes do foguete</p>
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

        {/* Nome da cor selecionada — reforço de vocabulário */}
        <div className="animate-fade-in-sm mt-4 flex items-center justify-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface py-2.5">
          <div className="h-5 w-5 rounded-full" style={{ backgroundColor: selectedColor.hex }} />
          <span className="font-display text-base font-bold text-cinema-text">{selectedColor.name}</span>
          <span className="font-body text-xs text-cinema-muted">({selectedColor.pt})</span>
        </div>

        {/* Foguete pintável */}
        <div className="mt-5 flex justify-center rounded-cinema-md border border-cinema-border bg-cinema-surface p-6">
          <svg viewBox="0 0 200 260" className="h-64 w-auto">
            {/* Chama */}
            <path
              d="M 100 210 Q 80 240 100 258 Q 120 240 100 210 Z"
              fill={colorOf("flame", "#e5e7eb")}
              stroke="#cbd5e1"
              strokeWidth="2"
              onClick={() => paintRegion("flame")}
              style={{ cursor: "pointer" }}
            />
            {/* Aleta esquerda */}
            <path
              d="M 70 160 L 30 210 L 70 200 Z"
              fill={colorOf("finLeft", "#e5e7eb")}
              stroke="#cbd5e1"
              strokeWidth="2"
              onClick={() => paintRegion("finLeft")}
              style={{ cursor: "pointer" }}
            />
            {/* Aleta direita */}
            <path
              d="M 130 160 L 170 210 L 130 200 Z"
              fill={colorOf("finRight", "#e5e7eb")}
              stroke="#cbd5e1"
              strokeWidth="2"
              onClick={() => paintRegion("finRight")}
              style={{ cursor: "pointer" }}
            />
            {/* Corpo */}
            <path
              d="M 70 200 L 70 100 Q 70 40 100 20 Q 130 40 130 100 L 130 200 Z"
              fill={colorOf("body", "#e5e7eb")}
              stroke="#cbd5e1"
              strokeWidth="2"
              onClick={() => paintRegion("body")}
              style={{ cursor: "pointer" }}
            />
            {/* Bico (ponta) */}
            <path
              d="M 100 20 Q 130 40 130 90 L 70 90 Q 70 40 100 20 Z"
              fill={colorOf("nose", "#e5e7eb")}
              stroke="#cbd5e1"
              strokeWidth="2"
              opacity="0.001"
              onClick={() => paintRegion("nose")}
              style={{ cursor: "pointer" }}
            />
            {/* Janela */}
            <circle
              cx="100"
              cy="120"
              r="18"
              fill={colorOf("window", "#e5e7eb")}
              stroke="#cbd5e1"
              strokeWidth="2"
              onClick={() => paintRegion("window")}
              style={{ cursor: "pointer" }}
            />
          </svg>
        </div>

        {/* Paleta de cores */}
        <div className="mb-2 mt-5 grid grid-cols-6 gap-2">
          {colors.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setSelectedColor(c)}
              className="flex aspect-square items-center justify-center rounded-xl transition-transform active:scale-90"
              style={{
                backgroundColor: c.hex,
                boxShadow: selectedColor.name === c.name ? `0 0 0 3px #fff, 0 0 0 5px ${c.hex}` : "none",
              }}
              aria-label={c.name}
            >
              {selectedColor.name === c.name && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
            </button>
          ))}
        </div>

        <p className="mb-2 text-center font-body text-xs font-bold text-cinema-muted">
          {paintedCount}/{REGIONS.length} partes pintadas
        </p>

        {isComplete && (
          <div
            className="animate-pop-in rounded-2xl p-5 text-center"
            style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}
          >
            <div className="mb-2 text-3xl">🚀</div>
            <h3 className="mb-1 font-display text-lg font-bold" style={{ color: "#16a34a" }}>
              Foguete completo!
            </h3>
            <p className="mb-4 font-body text-sm text-cinema-muted">{score} pontos nessa obra de arte</p>
            <button
              type="button"
              onClick={resetGame}
              className="mx-auto flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #ec4899, #db2777)" }}
            >
              <RotateCcw className="h-4 w-4" />
              Pintar de novo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
