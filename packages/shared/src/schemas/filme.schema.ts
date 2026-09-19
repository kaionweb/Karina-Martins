import { z } from "zod";

export const filmeLevelSchema = z.enum(["BASICO", "INTERMEDIARIO", "AVANCADO"]);

export type FilmeLevel = z.infer<typeof filmeLevelSchema>;

// Filme do catálogo, servido por GET /filmes e GET /filmes/:id. `videoId` é o
// id do YouTube (não-listado) — exposto publicamente igual ao videoId de vídeo
// avulso/episódio, usado pelo player IFrame (PlayerFacade) e para resolver o
// transcript da feature de repetição de frase.
export const filmeSummarySchema = z.object({
  id: z.string().cuid(),
  title: z.string(),
  emoji: z.string(),
  level: filmeLevelSchema,
  ageRange: z.string(),
  videoId: z.string(),
  durationSeconds: z.number().int().nonnegative(),
  thumbnailUrl: z.string().nullable(),
});

export type FilmeSummary = z.infer<typeof filmeSummarySchema>;

// Body do POST /admin/filmes (painel admin) — cria/atualiza um filme (upsert
// por videoId). `videoUrlOrId` aceita a URL colada (youtube.com/watch?v=…,
// youtu.be/…) ou o id puro; `duration` aceita segundos puros ("2550"),
// "mm:ss" ("42:30") ou "hh:mm:ss" ("1:05:00"). A normalização de ambos (extrair
// o videoId, converter a duração em segundos) fica no service, não no zod.
export const upsertFilmeSchema = z.object({
  title: z.string().min(1),
  emoji: z.string().min(1),
  level: filmeLevelSchema,
  ageRange: z.string().min(1),
  videoUrlOrId: z.string().min(1),
  duration: z.string().min(1),
});

export type UpsertFilmeInput = z.infer<typeof upsertFilmeSchema>;
