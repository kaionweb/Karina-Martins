"use client";

import type { TranscriptSentence } from "@ipp/shared";
import { formatDuration } from "@/components/videos/VideoCard";

export interface Chapter {
  // Número do capítulo = Math.floor(startTime / 60) (0-based, minuto do vídeo).
  index: number;
  // startTime da primeira frase do capítulo (onde o jump vai cair, em segundos).
  startTime: number;
  // Índice dessa primeira frase dentro do array `sentences` original.
  firstSentenceIndex: number;
}

/**
 * Agrupa as frases em blocos de 60 segundos por `startTime`: o capítulo N reúne
 * as frases com Math.floor(startTime / 60) === N. Retorna um item por capítulo
 * (na ordem em que aparecem), apontando para a primeira frase de cada bloco.
 * Função pura — o cálculo não depende do player nem de estado de React.
 */
export function buildChapters(sentences: TranscriptSentence[]): Chapter[] {
  const chapters: Chapter[] = [];
  const seen = new Set<number>();

  sentences.forEach((sentence, sentenceIndex) => {
    const chapterNumber = Math.floor(sentence.startTime / 60);
    if (seen.has(chapterNumber)) return;
    seen.add(chapterNumber);
    chapters.push({ index: chapterNumber, startTime: sentence.startTime, firstSentenceIndex: sentenceIndex });
  });

  return chapters;
}

// Atalho de navegação por capítulos, só usado na tela de filme (vídeos longos).
// Cada chip pula para a primeira frase do capítulo via onJump — sem travar o
// prev/next, que continua cruzando capítulos livremente.
export function ChapterJumpList({
  sentences,
  onJump,
}: {
  sentences: TranscriptSentence[];
  onJump: (firstSentenceIndex: number) => void;
}) {
  const chapters = buildChapters(sentences);
  if (chapters.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="font-body text-[10px] font-black uppercase tracking-wider text-cinema-muted">Capítulos</span>
      <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chapters.map((chapter, position) => (
          <button
            key={chapter.index}
            type="button"
            onClick={() => onJump(chapter.firstSentenceIndex)}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-cinema-border bg-cinema-surface-alt px-3 py-1.5 font-body text-xs font-bold text-cinema-text transition-colors hover:border-cinema-primary/40"
          >
            <span>Cap. {position + 1}</span>
            <span aria-hidden className="text-cinema-muted">
              ·
            </span>
            <span className="text-cinema-muted">{formatDuration(chapter.startTime)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
