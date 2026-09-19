import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@ipp/database";
import { apiErrorBody } from "../../common/errors/api-error";
import type { AccessTokenPayload } from "../../common/auth/jwt.util";
import { ProfilesService } from "../profiles/profiles.service";
import { GamificationService } from "../gamification/gamification.service";

@Injectable()
export class ParentService {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly gamificationService: GamificationService,
  ) {}

  async getJourney(activeUser: AccessTokenPayload, targetProfileId: string) {
    const targetProfile = await this.resolveChildProfile(activeUser, targetProfileId);

    const [xpTotal, badges, completedLessons] = await Promise.all([
      this.gamificationService.getXpTotal(targetProfileId),
      this.gamificationService.getBadges(targetProfileId),
      this.getCompletedLessons(targetProfileId),
    ]);

    return {
      profile: {
        id: targetProfile.id,
        nickname: targetProfile.nickname,
        type: targetProfile.type,
        ageRange: targetProfile.ageRange,
        currentStreak: targetProfile.currentStreak,
        longestStreak: targetProfile.longestStreak,
      },
      xpTotal: xpTotal.total,
      badges,
      completedLessons,
    };
  }

  async getTranscripts(activeUser: AccessTokenPayload, targetProfileId: string) {
    await this.resolveChildProfile(activeUser, targetProfileId);

    const sessions = await prisma.aiSession.findMany({
      where: { profileId: targetProfileId },
      include: { messages: { orderBy: { createdAt: "asc" } }, lesson: true },
      orderBy: { createdAt: "desc" },
    });

    return sessions.map((session) => ({
      id: session.id,
      lessonId: session.lessonId,
      lessonTitle: session.lesson?.title ?? null,
      language: session.language,
      promptTokens: session.promptTokens,
      completionTokens: session.completionTokens,
      createdAt: session.createdAt.toISOString(),
      messages: session.messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        flaggedByFilter: message.flaggedByFilter,
        createdAt: message.createdAt.toISOString(),
      })),
    }));
  }

  private async resolveChildProfile(activeUser: AccessTokenPayload, targetProfileId: string) {
    if (activeUser.profileId && (await this.profilesService.isChildProfile(activeUser.profileId))) {
      throw new ForbiddenException(
        apiErrorBody("FORBIDDEN", "Perfis infantis não podem acessar o painel do responsável"),
      );
    }

    const targetProfile = await prisma.profile.findUnique({ where: { id: targetProfileId } });

    // Não diferenciar "não existe" de "existe mas não é seu/não é CHILD" — mesmo
    // padrão de segurança já usado em ProfilesService.selectProfile (SEC-002).
    if (!targetProfile || targetProfile.userId !== activeUser.sub || targetProfile.type !== "CHILD") {
      throw new NotFoundException(apiErrorBody("PROFILE_NOT_FOUND", "Perfil não encontrado"));
    }

    return targetProfile;
  }

  private async getCompletedLessons(profileId: string) {
    // Story 10.3: só lições efetivamente concluídas entram na visão do responsável —
    // a existência da linha não significa mais conclusão (pode ter sido só acessada).
    const progress = await prisma.lessonProgress.findMany({
      where: { profileId, completed: true },
      include: { lesson: true },
      orderBy: { completedAt: "desc" },
    });

    // `completedAt` é nullable no schema, mas linhas `completed: true` sempre o têm
    // preenchido (completeLesson/seed). O flatMap descarta defensivamente qualquer nulo.
    return progress.flatMap((p) =>
      p.completedAt
        ? [{ lessonId: p.lesson.id, title: p.lesson.title, completedAt: p.completedAt.toISOString() }]
        : [],
    );
  }
}
