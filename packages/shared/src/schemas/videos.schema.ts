import { z } from "zod";
import { accessStatusSchema } from "./series.schema";

export const videoLevelSchema = z.enum(["INICIANTE", "INTERMEDIARIO", "AVANCADO"]);

export type VideoLevel = z.infer<typeof videoLevelSchema>;

export const videoSkillSchema = z.enum(["VOCABULARIO", "LISTENING", "MUSICA"]);

export type VideoSkill = z.infer<typeof videoSkillSchema>;

export const videoSummarySchema = z.object({
  id: z.string().cuid(),
  // null quando o vídeo está bloqueado pro perfil (ver accessStatus) — a
  // trava de verdade é não devolver o id do YouTube, não só desenhar um
  // cadeado na tela (mesmo princípio de SeriesEpisode).
  videoId: z.string().nullable(),
  title: z.string(),
  channel: z.string(),
  durationSeconds: z.number().int().nonnegative(),
  thumbnailUrl: z.string(),
  level: videoLevelSchema,
  ageRange: z.string(),
  skill: videoSkillSchema,
  theme: z.string(),
  // Controle de acesso (trial/premium) — só tem efeito pra skill=LISTENING
  // por enquanto; outras skills sempre vêm "unlocked". Ver computeVideoAccessStatus
  // em lib/access-control.ts.
  freeAfterTrial: z.boolean(),
  accessStatus: accessStatusSchema,
});

export type VideoSummary = z.infer<typeof videoSummarySchema>;

// Sem paginação: /videos hoje só é consumido pela tela Listening, que
// precisa do catálogo inteiro pra calcular a trava de nível no client (mesmo
// padrão de /series). Um teto de "limit" aqui truncaria silenciosamente os
// níveis que não couberem, como aconteceu quando o catálogo passou de 50
// vídeos — ver commit desta correção.
export const videoListQuerySchema = z.object({
  level: videoLevelSchema.optional(),
  ageRange: z.string().optional(),
  skill: videoSkillSchema.optional(),
  theme: z.string().optional(),
});

export type VideoListQuery = z.infer<typeof videoListQuerySchema>;

export const videoListResponseSchema = z.object({
  items: z.array(videoSummarySchema),
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
});

export type VideoListResponse = z.infer<typeof videoListResponseSchema>;

export const videoStatusSchema = z.enum(["AVAILABLE", "UNAVAILABLE"]);

export type VideoStatus = z.infer<typeof videoStatusSchema>;

export const videoDetailSchema = videoSummarySchema.extend({
  status: videoStatusSchema,
});

export type VideoDetail = z.infer<typeof videoDetailSchema>;

export const videoHeartbeatSchema = z.object({
  positionSeconds: z.number().int().min(0),
});

export type VideoHeartbeat = z.infer<typeof videoHeartbeatSchema>;

export const videoHeartbeatResponseSchema = z.object({
  watchedSeconds: z.number().int().nonnegative(),
  completed: z.boolean(),
  xpAwarded: z.number().int().nonnegative(),
  xpCapped: z.boolean(),
});

export type VideoHeartbeatResponse = z.infer<typeof videoHeartbeatResponseSchema>;

// Story 10.5 — body do POST /admin/playlists (cadastro de playlist curada via
// painel admin). Reaproveita videoLevelSchema/videoSkillSchema já definidos
// acima. `playlistUrlOrId` aceita tanto uma URL do YouTube (com ?list=/&list=)
// quanto o ID puro — a extração do id é feita no service (normalização, não
// validação de forma).
export const createPlaylistSchema = z.object({
  playlistUrlOrId: z.string().min(1),
  channel: z.string().min(1),
  level: videoLevelSchema,
  ageRange: z.string().min(1),
  skill: videoSkillSchema,
  theme: z.string().min(1),
});

export type CreatePlaylistInput = z.infer<typeof createPlaylistSchema>;
