import { z } from "zod";

// Frase legendada de um vídeo (EN + tradução PT), servida pela feature de
// repetição de frase (A-B repeat). `youtubeVideoId` é o id do YouTube (string),
// compartilhado entre Video (playlists) e SeriesEpisode (séries).
export const transcriptSentenceSchema = z.object({
  id: z.string().cuid(),
  youtubeVideoId: z.string(),
  order: z.number().int().positive(),
  startTime: z.number().nonnegative(),
  endTime: z.number().nonnegative(),
  textEn: z.string(),
  textPt: z.string(),
  needsReview: z.boolean(),
});

export type TranscriptSentence = z.infer<typeof transcriptSentenceSchema>;

// Uma frase no payload de save do admin (sem id — o replace recria tudo).
// `order` reflete a intenção do admin, mas o service normaliza para o índice
// do array + 1 ao persistir (garante o @@unique([youtubeVideoId, order])).
export const saveTranscriptSentenceSchema = z.object({
  order: z.number().int().positive(),
  startTime: z.number().nonnegative(),
  endTime: z.number().nonnegative(),
  textEn: z.string().min(1),
  textPt: z.string().min(1),
});

export type SaveTranscriptSentenceInput = z.infer<typeof saveTranscriptSentenceSchema>;

// Body do PUT /admin/transcripts/:youtubeVideoId — substitui todas as frases.
export const saveTranscriptSchema = z.object({
  sentences: z.array(saveTranscriptSentenceSchema),
});

export type SaveTranscriptInput = z.infer<typeof saveTranscriptSchema>;

// Item do dropdown do admin (GET /admin/transcripts/sources): junção de vídeos
// avulsos, episódios de série e filmes, cada um pelo seu youtubeVideoId.
export const transcriptSourceSchema = z.object({
  youtubeVideoId: z.string(),
  title: z.string(),
  kind: z.enum(["video", "episode", "filme"]),
});

export type TranscriptSource = z.infer<typeof transcriptSourceSchema>;

// Body do PATCH /admin/transcripts/review/:sentenceId — corrige o textPt de
// UMA frase e marca needsReview: false. Diferente do PUT (replace completo).
export const reviewTranscriptSentenceSchema = z.object({
  textPt: z.string().min(1),
});

export type ReviewTranscriptSentenceInput = z.infer<typeof reviewTranscriptSentenceSchema>;

// Grupo de frases pendentes de revisão de um mesmo vídeo/episódio/filme —
// devolvido por GET /admin/transcripts/pending, alimenta a tela de revisão.
export const pendingTranscriptGroupSchema = z.object({
  youtubeVideoId: z.string(),
  title: z.string(),
  kind: z.enum(["video", "episode", "filme"]),
  sentences: z.array(transcriptSentenceSchema),
});

export type PendingTranscriptGroup = z.infer<typeof pendingTranscriptGroupSchema>;
