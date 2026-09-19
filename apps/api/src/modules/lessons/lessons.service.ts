import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, prisma } from "@ipp/database";
import type { ContinueLearningResponse } from "@ipp/shared";
import { apiErrorBody } from "../../common/errors/api-error";
import { GamificationService } from "../gamification/gamification.service";

const LESSON_COMPLETION_XP = 10;

@Injectable()
export class LessonsService {
  constructor(private readonly gamificationService: GamificationService) {}

  async getLesson(id: string, profileId?: string) {
    const lesson = await prisma.lesson.findUnique({ where: { id } });
    if (!lesson) {
      throw new NotFoundException(apiErrorBody("LESSON_NOT_FOUND", "Lição não encontrada"));
    }

    // Efeito colateral (Story 10.3): registra/atualiza o acesso do perfil ativo à
    // lição. O `update` toca apenas `lastAccessedAt` — nunca `completed`/`completedAt`,
    // para não confundir "acessou" com "concluiu". Sem perfil ativo, apenas retorna.
    if (profileId) {
      await prisma.lessonProgress.upsert({
        where: { profileId_lessonId: { profileId, lessonId: id } },
        create: { profileId, lessonId: id, lastAccessedAt: new Date() },
        update: { lastAccessedAt: new Date() },
      });
    }

    return lesson;
  }

  async completeLesson(lessonId: string, profileId: string | undefined) {
    if (!profileId) {
      throw new ForbiddenException(apiErrorBody("NO_ACTIVE_PROFILE", "Nenhum perfil ativo selecionado"));
    }

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      throw new NotFoundException(apiErrorBody("LESSON_NOT_FOUND", "Lição não encontrada"));
    }

    // Story 10.3: a existência da linha não significa mais "concluída" (pode ter sido
    // apenas acessada via GET /lessons/:id). A idempotência de XP olha o campo
    // explícito `completed`.
    //
    // CONC-001 (gate 10.3): a decisão de idempotência acontece DENTRO de uma única
    // transação interativa, via compare-and-swap no campo `completed`, e NÃO por uma
    // leitura externa (`findUnique` fora da transação, como antes). A mudança de
    // `create`→`upsert` — necessária porque getLesson pode ter criado a linha como
    // `completed:false` para rastrear lastAccessedAt — removeu o fail-safe que a
    // unique constraint dava antes (o `create` original falhava com P2002 no 2º
    // request concorrente, revertendo a transação e evitando XP duplicado). O
    // `updateMany` abaixo reintroduz a serialização: o WHERE `completed:false` é
    // re-avaliado sob o write-lock da linha, então apenas UMA transação concorrente
    // vira `false→true` (count === 1) e emite o XpEvent; a perdedora vê count 0 e não
    // credita nada. Espelha a resolução do REL-001 da 9.3 (idempotência dentro de um
    // único $transaction interativo). Garante: sob N completes concorrentes para o
    // mesmo perfil+lição, no máximo 1 XpEvent e no máximo 1 badge FIRST_LESSON.
    const now = new Date();

    let xpAwarded = 0;
    let isFirstCompletedLesson = false;

    try {
      const outcome = await prisma.$transaction(async (tx) => {
        // (1) Garante a existência da linha SEM tocar `completed`. No update apenas
        // toca lastAccessedAt (concluir é também acessar) — isso serializa dois
        // completes concorrentes sobre uma linha já existente já neste passo, além
        // de evitar um `update: {}` vazio.
        await tx.lessonProgress.upsert({
          where: { profileId_lessonId: { profileId, lessonId } },
          create: { profileId, lessonId, lastAccessedAt: now },
          update: { lastAccessedAt: now },
        });

        // (2) Compare-and-swap atômico. Apenas a transação que efetivamente vira a
        // linha de `completed:false` para `true` obtém count === 1.
        const flipped = await tx.lessonProgress.updateMany({
          where: { profileId, lessonId, completed: false },
          data: { completed: true, completedAt: now, lastAccessedAt: now },
        });

        if (flipped.count !== 1) {
          // Já estava concluída (idempotência sequencial) ou outra transação venceu
          // a corrida (idempotência concorrente). Nenhum XP é creditado.
          return { xpAwarded: 0, isFirstCompletedLesson: false };
        }

        // (3) Só a transação vencedora credita XP no ledger (fonte única de verdade).
        await tx.xpEvent.create({
          data: { profileId, amount: LESSON_COMPLETION_XP, source: "LESSON_COMPLETED" },
        });

        // FIRST_LESSON é decidido dentro da mesma transação: só a vencedora da
        // primeiríssima conclusão vê count === 1, então o badge é concedido no
        // máximo uma vez mesmo sob concorrência.
        const completedLessonsCount = await tx.lessonProgress.count({
          where: { profileId, completed: true },
        });

        return {
          xpAwarded: LESSON_COMPLETION_XP,
          isFirstCompletedLesson: completedLessonsCount === 1,
        };
      });

      xpAwarded = outcome.xpAwarded;
      isFirstCompletedLesson = outcome.isFirstCompletedLesson;
    } catch (error) {
      // Corrida na CRIAÇÃO da linha: perfil nunca acessou a lição antes + dois
      // completes simultâneos. O upsert de uma das transações colide na unique
      // constraint (profileId, lessonId) → P2002 → a transação inteira reverte. A
      // vencedora já criou a linha + o XpEvent, então a perdedora apenas não credita
      // XP — a garantia (no máx. 1 XpEvent) é preservada. A única unique constraint
      // em jogo neste fluxo é a de LessonProgress (XpEvent não tem nenhuma), então um
      // P2002 aqui só pode significar "perdi a corrida de criação".
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        xpAwarded = 0;
        isFirstCompletedLesson = false;
      } else {
        throw error;
      }
    }

    if (isFirstCompletedLesson) {
      await this.gamificationService.awardBadgeIfEligible(profileId, "FIRST_LESSON");
    }

    const totalResult = await prisma.xpEvent.aggregate({ _sum: { amount: true }, where: { profileId } });

    return {
      xpAwarded,
      xpTotal: totalResult._sum.amount ?? 0,
    };
  }

  async getContinueLearning(profileId: string): Promise<ContinueLearningResponse> {
    // Lição mais recentemente acessada pelo perfil (independentemente de conclusão).
    const recent = await prisma.lessonProgress.findFirst({
      where: { profileId, lastAccessedAt: { not: null } },
      orderBy: { lastAccessedAt: "desc" },
      include: { lesson: { include: { track: true } } },
    });

    if (!recent) {
      return { hasProgress: false };
    }

    const track = recent.lesson.track;
    const lessonsInTrack = await prisma.lesson.findMany({
      where: { trackId: track.id },
      orderBy: { order: "asc" },
    });
    const totalLessonsInTrack = lessonsInTrack.length;
    const lessonPosition = lessonsInTrack.findIndex((lesson) => lesson.id === recent.lessonId) + 1;

    const completedCount = await prisma.lessonProgress.count({
      where: { profileId, completed: true, lessonId: { in: lessonsInTrack.map((lesson) => lesson.id) } },
    });
    const trackProgressPercent =
      totalLessonsInTrack === 0 ? 0 : Math.round((completedCount / totalLessonsInTrack) * 100);

    return {
      hasProgress: true,
      lessonId: recent.lessonId,
      lessonTitle: recent.lesson.title,
      trackId: track.id,
      trackTitle: track.title,
      lessonPosition,
      totalLessonsInTrack,
      trackProgressPercent,
    };
  }
}
