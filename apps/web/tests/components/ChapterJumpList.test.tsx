import { describe, expect, it, vi } from "vitest";
import type { TranscriptSentence } from "@ipp/shared";

// ChapterJumpList importa formatDuration de VideoCard, que usa next/image.
vi.mock("next/image", () => ({
  default: ({ fill: _fill, ...props }: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

import { buildChapters } from "@/components/videos/ChapterJumpList";

function sentence(order: number, startTime: number): TranscriptSentence {
  return {
    id: `s${order}`,
    youtubeVideoId: "yt-long",
    order,
    startTime,
    endTime: startTime + 3,
    textEn: `line ${order}`,
    textPt: `linha ${order}`,
    needsReview: false,
  };
}

describe("buildChapters", () => {
  it("agrupa as frases em blocos de 60s por startTime (capítulo N = floor(startTime/60))", () => {
    const sentences = [
      sentence(1, 0), // cap 0
      sentence(2, 30), // cap 0
      sentence(3, 65), // cap 1
      sentence(4, 90), // cap 1
      sentence(5, 130), // cap 2
    ];

    const chapters = buildChapters(sentences);

    expect(chapters).toEqual([
      { index: 0, startTime: 0, firstSentenceIndex: 0 },
      { index: 1, startTime: 65, firstSentenceIndex: 2 },
      { index: 2, startTime: 130, firstSentenceIndex: 4 },
    ]);
  });

  it("aponta firstSentenceIndex para a primeira frase de cada capítulo no array original", () => {
    const sentences = [sentence(1, 10), sentence(2, 20), sentence(3, 61)];
    const chapters = buildChapters(sentences);

    expect(chapters.map((c) => c.firstSentenceIndex)).toEqual([0, 2]);
    expect(chapters[0].startTime).toBe(10);
    expect(chapters[1].startTime).toBe(61);
  });

  it("pula capítulos sem frases (minuto vazio não vira capítulo)", () => {
    const sentences = [sentence(1, 5), sentence(2, 185)]; // cap 0 e cap 3
    const chapters = buildChapters(sentences);

    expect(chapters.map((c) => c.index)).toEqual([0, 3]);
  });

  it("retorna vazio para lista vazia", () => {
    expect(buildChapters([])).toEqual([]);
  });

  it("um único capítulo quando todas as frases cabem em 60s", () => {
    const sentences = [sentence(1, 0), sentence(2, 15), sentence(3, 45)];
    const chapters = buildChapters(sentences);

    expect(chapters).toHaveLength(1);
    expect(chapters[0]).toEqual({ index: 0, startTime: 0, firstSentenceIndex: 0 });
  });
});
