"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { TranscriptSentence } from "@ipp/shared";

interface SentenceCardProps {
  sentence: TranscriptSentence;
  index: number;
  total: number;
  progress: number;
  drillActive: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function SentenceCard({
  sentence,
  index,
  total,
  progress,
  drillActive,
  onPrev,
  onNext,
}: SentenceCardProps) {
  // Reseta a revelação da tradução sempre que a frase atual muda (mesmo
  // comportamento do componente de referência).
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    setRevealed(false);
  }, [sentence.id]);

  const showTranslation = !drillActive || revealed;

  return (
    <div className="rounded-cinema-md border border-cinema-border bg-cinema-surface p-5">
      {/* Barra de progresso da frase atual */}
      <div className="mb-4 h-1 w-full overflow-hidden rounded-cinema-full bg-cinema-surface-alt">
        <div
          className="h-full rounded-cinema-full bg-cinema-primary transition-[width] duration-200 ease-linear"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      {/* Frase em inglês (destaque) */}
      <p className="font-display text-lg font-bold leading-snug text-cinema-text">{sentence.textEn}</p>

      {/* Tradução ou botão de revelar (Drill) */}
      <div className="mt-2 min-h-[1.5rem]">
        {showTranslation ? (
          <p className="font-body text-sm text-cinema-muted">{sentence.textPt}</p>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="font-body text-sm font-semibold text-cinema-primary underline decoration-cinema-primary/40 underline-offset-2"
          >
            Toque pra ver a tradução
          </button>
        )}
      </div>

      {/* Navegação anterior / próxima + contador */}
      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          disabled={index === 0}
          aria-label="Frase anterior"
          className="flex h-9 w-9 items-center justify-center rounded-cinema-full border border-cinema-border bg-cinema-surface text-cinema-text transition-colors hover:border-cinema-primary/40 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="font-body text-xs font-bold text-cinema-muted">
          {index + 1}/{total}
        </span>

        <button
          type="button"
          onClick={onNext}
          disabled={index === total - 1}
          aria-label="Próxima frase"
          className="flex h-9 w-9 items-center justify-center rounded-cinema-full border border-cinema-border bg-cinema-surface text-cinema-text transition-colors hover:border-cinema-primary/40 disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
