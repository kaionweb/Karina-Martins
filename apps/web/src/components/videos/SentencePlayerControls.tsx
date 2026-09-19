"use client";

import { Repeat } from "lucide-react";

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25] as const;

// Vermelho da marca Karina Martins (#DA233B) para o estado "ativo" do loop —
// não há token cinema-* de vermelho; usa-se o literal, mesmo padrão do código
// de nível INTERMEDIARIO em /admin/series. O fundo/texto seguem o tema claro.
const BRAND_RED = "#DA233B";

interface SentencePlayerControlsProps {
  speed: number;
  onSpeedChange: (speed: number) => void;
  loopActive: boolean;
  onLoopToggle: (active: boolean) => void;
  drillActive: boolean;
  onDrillToggle: (active: boolean) => void;
}

export function SentencePlayerControls({
  speed,
  onSpeedChange,
  loopActive,
  onLoopToggle,
  drillActive,
  onDrillToggle,
}: SentencePlayerControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-cinema-md border border-cinema-border bg-cinema-surface px-4 py-3">
      {/* Velocidade */}
      <label className="flex items-center gap-2">
        <span className="font-body text-[11px] font-black uppercase tracking-wider text-cinema-muted">
          Velocidade
        </span>
        <select
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          aria-label="Velocidade de reprodução"
          className="h-8 rounded-cinema-sm border border-cinema-border bg-cinema-bg px-2 font-body text-xs font-bold text-cinema-text outline-none focus:border-cinema-primary-alt/60 focus:ring-4 focus:ring-cinema-primary/10"
        >
          {SPEED_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}x
            </option>
          ))}
        </select>
      </label>

      {/* Loop A-B */}
      <button
        type="button"
        onClick={() => onLoopToggle(!loopActive)}
        aria-pressed={loopActive}
        className="flex items-center gap-1.5 rounded-cinema-full border px-3 py-1.5 font-body text-xs font-bold transition-colors"
        style={
          loopActive
            ? { borderColor: BRAND_RED, backgroundColor: `${BRAND_RED}14`, color: BRAND_RED }
            : undefined
        }
      >
        <Repeat
          className={`h-3.5 w-3.5 ${loopActive ? "" : "text-cinema-muted"}`}
          strokeWidth={2.5}
        />
        <span className={loopActive ? "" : "text-cinema-muted"}>Repetir</span>
      </button>

      {/* Drill: esconde a tradução até tocar */}
      <button
        type="button"
        onClick={() => onDrillToggle(!drillActive)}
        aria-pressed={drillActive}
        className="ml-auto flex items-center gap-2 font-body text-xs font-bold text-cinema-text"
      >
        <span>Modo Drill</span>
        <span
          className="relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-cinema-full transition-colors"
          style={{ backgroundColor: drillActive ? BRAND_RED : "#E5EAF2" }}
        >
          <span
            className="inline-block h-4 w-4 transform rounded-cinema-full bg-white shadow-sm transition-transform"
            style={{ transform: drillActive ? "translateX(18px)" : "translateX(2px)" }}
          />
        </span>
      </button>
    </div>
  );
}
