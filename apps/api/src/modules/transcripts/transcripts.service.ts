import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@ipp/database";
import type { PendingTranscriptGroup, SaveTranscriptInput, TranscriptSentence } from "@ipp/shared";
import { apiErrorBody } from "../../common/errors/api-error";

@Injectable()
export class TranscriptsService {
  // Frases ordenadas de um vídeo do YouTube, INCLUINDO as pendentes de revisão
  // (needsReview: true) — uso exclusivo do admin, que precisa enxergar tudo
  // pra poder revisar. Rotas públicas usam getPublicByYoutubeVideoId.
  async getByYoutubeVideoId(youtubeVideoId: string): Promise<TranscriptSentence[]> {
    return prisma.transcriptSentence.findMany({
      where: { youtubeVideoId },
      orderBy: { order: "asc" },
    });
  }

  // Mesma leitura, mas para os players (vídeos/filmes/séries): nunca devolve
  // uma frase com needsReview true, pra criança nunca ver uma tradução ainda
  // não conferida por um humano. Buracos na sequência de `order` não quebram
  // nada no player — ele navega pelas frases por índice do array, não por order.
  async getPublicByYoutubeVideoId(youtubeVideoId: string): Promise<TranscriptSentence[]> {
    return prisma.transcriptSentence.findMany({
      where: { youtubeVideoId, needsReview: false },
      orderBy: { order: "asc" },
    });
  }

  // Todas as frases pendentes de revisão, agrupadas por vídeo/episódio/filme
  // de origem (mesma junção de fontes usada em listSources) — alimenta a tela
  // /admin/transcripts/revisao.
  async getPendingReview(): Promise<PendingTranscriptGroup[]> {
    const pending = await prisma.transcriptSentence.findMany({
      where: { needsReview: true },
      orderBy: [{ youtubeVideoId: "asc" }, { order: "asc" }],
    });
    if (pending.length === 0) return [];

    const youtubeVideoIds = [...new Set(pending.map((s) => s.youtubeVideoId))];
    const [videos, episodes, filmes] = await Promise.all([
      prisma.video.findMany({ where: { videoId: { in: youtubeVideoIds } }, select: { videoId: true, title: true } }),
      prisma.seriesEpisode.findMany({
        where: { videoId: { in: youtubeVideoIds } },
        select: { videoId: true, title: true },
      }),
      prisma.filme.findMany({ where: { videoId: { in: youtubeVideoIds } }, select: { videoId: true, title: true } }),
    ]);

    const sourceByVideoId = new Map<string, { title: string; kind: "video" | "episode" | "filme" }>();
    videos.forEach((v) => sourceByVideoId.set(v.videoId, { title: v.title, kind: "video" }));
    episodes.forEach((e) => sourceByVideoId.set(e.videoId, { title: e.title, kind: "episode" }));
    filmes.forEach((f) => sourceByVideoId.set(f.videoId, { title: f.title, kind: "filme" }));

    const groups = new Map<string, PendingTranscriptGroup>();
    for (const sentence of pending) {
      if (!groups.has(sentence.youtubeVideoId)) {
        const source = sourceByVideoId.get(sentence.youtubeVideoId);
        groups.set(sentence.youtubeVideoId, {
          youtubeVideoId: sentence.youtubeVideoId,
          title: source?.title ?? sentence.youtubeVideoId,
          kind: source?.kind ?? "video",
          sentences: [],
        });
      }
      groups.get(sentence.youtubeVideoId)!.sentences.push(sentence);
    }

    return [...groups.values()];
  }

  // Marca UMA frase como revisada (textPt corrigido + needsReview: false) —
  // diferente do replace completo do PUT, que reescreve o transcript inteiro.
  async markReviewed(sentenceId: string, textPt: string): Promise<TranscriptSentence> {
    const sentence = await prisma.transcriptSentence.findUnique({ where: { id: sentenceId } });
    if (!sentence) {
      throw new NotFoundException(apiErrorBody("SENTENCE_NOT_FOUND", "Frase não encontrada"));
    }

    return prisma.transcriptSentence.update({
      where: { id: sentenceId },
      data: { textPt, needsReview: false },
    });
  }

  // Substitui todas as frases do vídeo numa transação (apaga tudo + recria).
  // `order` é re-derivado do índice do array (+1) para garantir o
  // @@unique([youtubeVideoId, order]) mesmo que o admin envie orders repetidos.
  // needsReview sempre sai false aqui: o zod (saveTranscriptSentenceSchema)
  // exige textPt não-vazio, ou seja, esse caminho é sempre conteúdo já digitado
  // por um humano no admin — nunca o pipeline automático (esse usa o seed).
  async replaceForYoutubeVideoId(
    youtubeVideoId: string,
    input: SaveTranscriptInput,
  ): Promise<TranscriptSentence[]> {
    return prisma.$transaction(async (tx) => {
      await tx.transcriptSentence.deleteMany({ where: { youtubeVideoId } });

      if (input.sentences.length > 0) {
        await tx.transcriptSentence.createMany({
          data: input.sentences.map((sentence, index) => ({
            youtubeVideoId,
            order: index + 1,
            startTime: sentence.startTime,
            endTime: sentence.endTime,
            textEn: sentence.textEn,
            textPt: sentence.textPt,
            needsReview: false,
          })),
        });
      }

      return tx.transcriptSentence.findMany({
        where: { youtubeVideoId },
        orderBy: { order: "asc" },
      });
    });
  }
}
