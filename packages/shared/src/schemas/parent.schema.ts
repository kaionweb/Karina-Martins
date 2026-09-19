import { z } from "zod";
import { badgeSchema } from "./gamification.schema";

export const profileSummarySchema = z.object({
  id: z.string().cuid(),
  nickname: z.string(),
  type: z.enum(["ADULT", "CHILD"]),
  ageRange: z.string().nullable(),
  avatarUrl: z.string().nullable().optional(),
  currentStreak: z.number(),
  longestStreak: z.number(),
  // Início do trial de 7 dias (controle de acesso — ver lib/access-control.ts).
  // Serializado como string ISO no JSON de resposta.
  trialStartedAt: z.string(),
});

export type ProfileSummary = z.infer<typeof profileSummarySchema>;

export const completedLessonSummarySchema = z.object({
  lessonId: z.string().cuid(),
  title: z.string(),
  completedAt: z.string(),
});

export type CompletedLessonSummary = z.infer<typeof completedLessonSummarySchema>;

export const journeyResponseSchema = z.object({
  profile: profileSummarySchema,
  xpTotal: z.number(),
  badges: z.array(badgeSchema),
  completedLessons: z.array(completedLessonSummarySchema),
});

export type JourneyResponse = z.infer<typeof journeyResponseSchema>;

export const aiMessageSummarySchema = z.object({
  id: z.string().cuid(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  flaggedByFilter: z.boolean(),
  createdAt: z.string(),
});

export type AiMessageSummary = z.infer<typeof aiMessageSummarySchema>;

export const aiSessionTranscriptSchema = z.object({
  id: z.string().cuid(),
  lessonId: z.string().cuid().nullable(),
  lessonTitle: z.string().nullable(),
  language: z.enum(["EN", "PT"]),
  promptTokens: z.number(),
  completionTokens: z.number(),
  createdAt: z.string(),
  messages: z.array(aiMessageSummarySchema),
});

export type AiSessionTranscript = z.infer<typeof aiSessionTranscriptSchema>;
