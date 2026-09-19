import { z } from "zod";
import { accessStatusSchema, seriesSummarySchema } from "./series.schema";
import { videoSummarySchema } from "./videos.schema";

// GET /admin/profiles — dropdown do modo comparação (Perfil real a simular),
// não o profile de teste fixo do protótipo original.
export const adminProfileOptionSchema = z.object({
  id: z.string().cuid(),
  nickname: z.string(),
  type: z.enum(["ADULT", "CHILD"]),
  familyEmail: z.string(),
});

export type AdminProfileOption = z.infer<typeof adminProfileOptionSchema>;

// GET /admin/access-preview?profileId=X — catálogo + status de acesso
// calculados para o perfil escolhido, sempre com bypass=false (o admin nunca
// herda o próprio bypass durante a simulação).
export const accessPreviewResponseSchema = z.object({
  series: z.array(seriesSummarySchema),
  statusById: z.record(z.string(), accessStatusSchema),
  trialActive: z.boolean(),
  trialDaysRemaining: z.number(),
});

export type AccessPreviewResponse = z.infer<typeof accessPreviewResponseSchema>;

// GET /admin/access-preview/listening?profileId=X — mesma ideia, pro
// catálogo de Listening (Video/CuratedPlaylist).
export const listeningAccessPreviewResponseSchema = z.object({
  videos: z.array(videoSummarySchema),
  statusById: z.record(z.string(), accessStatusSchema),
  trialActive: z.boolean(),
  trialDaysRemaining: z.number(),
});

export type ListeningAccessPreviewResponse = z.infer<typeof listeningAccessPreviewResponseSchema>;
