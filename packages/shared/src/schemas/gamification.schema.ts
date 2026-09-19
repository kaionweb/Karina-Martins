import { z } from "zod";

export const completeLessonResponseSchema = z.object({
  xpAwarded: z.number(),
  xpTotal: z.number(),
});

export type CompleteLessonResponse = z.infer<typeof completeLessonResponseSchema>;

export const xpTotalResponseSchema = z.object({
  total: z.number(),
});

export type XpTotalResponse = z.infer<typeof xpTotalResponseSchema>;

export const badgeSchema = z.object({
  id: z.string().cuid(),
  code: z.string(),
  title: z.string(),
  description: z.string(),
  iconKey: z.string(),
  awardedAt: z.string(),
});

export type Badge = z.infer<typeof badgeSchema>;

export const rankingResponseSchema = z.object({
  position: z.number().int().min(1).nullable(),
  totalParticipants: z.number().int().min(0),
});

export type RankingResponse = z.infer<typeof rankingResponseSchema>;
