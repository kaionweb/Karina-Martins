import { Injectable } from "@nestjs/common";
import { prisma, AiLanguage } from "@ipp/database";
import { isPremiumProfile, isTrialActive } from "@ipp/shared";

const DEFAULT_AI_DAILY_LIMIT = 15;

function utcMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export interface RecordInteractionParams {
  profileId: string;
  lessonId: string | null;
  language: AiLanguage;
  userMessage: string;
  assistantContent: string;
  promptTokens: number;
  completionTokens: number;
  flaggedByFilter: boolean;
}

@Injectable()
export class AiUsageService {
  // Isento durante o trial (tudo liberado, ver CLAUDE.md) e para perfis
  // Premium (isPremiumProfile é um stub que sempre retorna false por
  // enquanto — único ponto a trocar quando a assinatura de verdade existir).
  // Fora disso, conta em AiMessageUsage: um registro por perfil por dia, sem
  // precisar de cron pra resetar à meia-noite (se não existe registro pro
  // dia atual, a contagem é 0).
  async isDailyLimitReached(profileId: string): Promise<boolean> {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { trialStartedAt: true },
    });

    if (isTrialActive(profile?.trialStartedAt) || isPremiumProfile(profile)) {
      return false;
    }

    const limit = Number(process.env.AI_DAILY_LIMIT) || DEFAULT_AI_DAILY_LIMIT;
    const startOfToday = utcMidnight(new Date());

    const usage = await prisma.aiMessageUsage.findUnique({
      where: { profileId_date: { profileId, date: startOfToday } },
    });

    return (usage?.count ?? 0) >= limit;
  }

  async recordInteraction(params: RecordInteractionParams): Promise<void> {
    const startOfToday = utcMidnight(new Date());

    await prisma.$transaction(async (tx) => {
      const session = await tx.aiSession.create({
        data: {
          profileId: params.profileId,
          lessonId: params.lessonId,
          language: params.language,
          promptTokens: params.promptTokens,
          completionTokens: params.completionTokens,
        },
      });

      await tx.aiMessage.createMany({
        data: [
          { sessionId: session.id, role: "user", content: params.userMessage, flaggedByFilter: false },
          {
            sessionId: session.id,
            role: "assistant",
            content: params.assistantContent,
            flaggedByFilter: params.flaggedByFilter,
          },
        ],
      });

      // Contador do limite diário — independente de AiSession (que segue
      // existindo só pra alimentar a transcrição visível ao responsável).
      await tx.aiMessageUsage.upsert({
        where: { profileId_date: { profileId: params.profileId, date: startOfToday } },
        create: { profileId: params.profileId, date: startOfToday, count: 1 },
        update: { count: { increment: 1 } },
      });
    });
  }
}
