import { z } from "zod";

export const showSchema = z.object({
  id: z.string().cuid(),
  title: z.string(),
  synopsis: z.string(),
  thumbnailKey: z.string(),
  createdAt: z.string(),
});

export type Show = z.infer<typeof showSchema>;

export const trackSchema = z.object({
  id: z.string().cuid(),
  title: z.string(),
  order: z.number(),
});

export type Track = z.infer<typeof trackSchema>;

export const lessonSchema = z.object({
  id: z.string().cuid(),
  title: z.string(),
  order: z.number(),
  contentBody: z.string(),
  trackId: z.string().cuid(),
});

export type Lesson = z.infer<typeof lessonSchema>;

export const lessonWithProgressSchema = lessonSchema.extend({
  completed: z.boolean(),
});

export type LessonWithProgress = z.infer<typeof lessonWithProgressSchema>;

// Story 10.3: resposta do card "Continuar aprendendo" (GET /lessons/continue-learning).
// União discriminada por `hasProgress`: sem nenhum acesso prévio, apenas
// `{ hasProgress: false }`; com acesso, os dados da lição mais recente + progresso da trilha.
export const continueLearningSchema = z.discriminatedUnion("hasProgress", [
  z.object({ hasProgress: z.literal(false) }),
  z.object({
    hasProgress: z.literal(true),
    lessonId: z.string().cuid(),
    lessonTitle: z.string(),
    trackId: z.string().cuid(),
    trackTitle: z.string(),
    lessonPosition: z.number().int(),
    totalLessonsInTrack: z.number().int(),
    trackProgressPercent: z.number().int(),
  }),
]);

export type ContinueLearningResponse = z.infer<typeof continueLearningSchema>;
