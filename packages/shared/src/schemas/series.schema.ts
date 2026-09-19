import { z } from "zod";

export const seriesLevelSchema = z.enum(["BASICO", "INTERMEDIARIO", "AVANCADO"]);

export type SeriesLevel = z.infer<typeof seriesLevelSchema>;

// Status de acesso (trial/premium) — ver computeAccessStatus em
// lib/access-control.ts. Compartilhado entre Series e Video/Listening (e
// pela resposta de /admin/access-preview), não redeclarado por catálogo.
export const accessStatusSchema = z.enum(["unlocked", "locked-progress", "locked-premium"]);

export const seriesSummarySchema = z.object({
  id: z.string().cuid(),
  title: z.string(),
  emoji: z.string(),
  level: seriesLevelSchema,
  ageRange: z.string(),
  seasons: z.number().int().positive(),
  playlistId: z.string().nullable(),
  episodesCount: z.number().int().nonnegative(),
  // Metadados de catálogo/Explorar — null nas séries cadastradas antes dessa
  // feature ou ainda sem curadoria de gênero/habilidade.
  genre: z.string().nullable(),
  skills: z.array(z.string()).nullable(),
  description: z.string().nullable(),
  featured: z.boolean(),
  // Todos os episódios visíveis (AVAILABLE + não-ocultos) da série têm
  // SeriesEpisodeProgress do perfil ativo — usado pela trava de progressão
  // por nível (Básico → Intermediário → Avançado) em Séries/Explorar.
  completed: z.boolean(),
  // Controle de acesso (trial/premium) — ver computeSeriesAccessStatus em
  // lib/access-control.ts. freeAfterTrial: item grátis-permanente mesmo após
  // o trial acabar. hasStartedProgress: pelo menos um episódio visível já
  // assistido pelo perfil ativo (grandfathering — false sem perfil ativo).
  freeAfterTrial: z.boolean(),
  hasStartedProgress: z.boolean(),
});

export type SeriesSummary = z.infer<typeof seriesSummarySchema>;

export const seriesEpisodeStatusSchema = z.enum(["AVAILABLE", "UNAVAILABLE"]);

export type SeriesEpisodeStatus = z.infer<typeof seriesEpisodeStatusSchema>;

export const seriesEpisodeSchema = z.object({
  id: z.string().cuid(),
  // videoId do YouTube — usado pelo player IFrame (PlayerFacade) e para
  // resolver o transcript da feature de repetição de frase.
  videoId: z.string(),
  season: z.number().int().positive(),
  number: z.number().int().positive(),
  title: z.string(),
  durationSeconds: z.number().int().nonnegative(),
  thumbnailUrl: z.string(),
  status: seriesEpisodeStatusSchema,
  watched: z.boolean(),
});

export type SeriesEpisodeWithProgress = z.infer<typeof seriesEpisodeSchema>;

// Body do POST /admin/series (painel admin) — cadastra/atualiza a playlist
// de uma série e dispara a sincronização dos episódios via YouTube Data API.
// `playlistUrlOrId` aceita URL (com ?list=/&list=) ou o ID puro, mesmo
// contrato de createPlaylistSchema (Story 10.5) — normalização fica no service.
// `season` diz a qual temporada os episódios dessa playlist pertencem — o
// sync só mexe nos episódios daquela temporada, nunca nas outras.
export const upsertSeriesSchema = z.object({
  title: z.string().min(1),
  emoji: z.string().min(1),
  level: seriesLevelSchema,
  ageRange: z.string().min(1),
  seasons: z.coerce.number().int().positive(),
  playlistUrlOrId: z.string().min(1),
  season: z.coerce.number().int().positive().default(1),
});

export type UpsertSeriesInput = z.infer<typeof upsertSeriesSchema>;

// GET /admin/series/:id/episodes — visão completa do admin (inclui ocultos e
// indisponíveis, que a rota pública nunca mostra).
export const adminSeriesEpisodeSchema = z.object({
  id: z.string().cuid(),
  season: z.number().int().positive(),
  number: z.number().int().positive(),
  title: z.string(),
  durationSeconds: z.number().int().nonnegative(),
  thumbnailUrl: z.string(),
  status: seriesEpisodeStatusSchema,
  hidden: z.boolean(),
});

export type AdminSeriesEpisode = z.infer<typeof adminSeriesEpisodeSchema>;

export const setHiddenSchema = z.object({
  hidden: z.boolean(),
});

export type SetHiddenInput = z.infer<typeof setHiddenSchema>;

// PATCH /admin/series/:id/free-after-trial — override manual da regra
// automática (primeira série de cada nível nasce freeAfterTrial=true).
export const setFreeAfterTrialSchema = z.object({
  freeAfterTrial: z.boolean(),
});

export type SetFreeAfterTrialInput = z.infer<typeof setFreeAfterTrialSchema>;
