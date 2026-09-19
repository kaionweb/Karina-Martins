import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@ipp/database";
import type { VideoHeartbeatResponse } from "@ipp/shared";
import { apiErrorBody } from "../../common/errors/api-error";
import { VideosService } from "./videos.service";

// Mesmo valor de LESSON_COMPLETION_XP (lessons.service.ts): XP de vídeo e de lição
// têm o mesmo peso relativo (Story 9.3, decisão 3).
const VIDEO_COMPLETION_XP = 10;
const DEFAULT_VIDEO_XP_DAILY_CAP = 30;
const COMPLETION_THRESHOLD = 0.8;

function utcMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

@Injectable()
export class VideoWatchService {
  constructor(private readonly videosService: VideosService) {}

  async registerHeartbeat(
    profileId: string | undefined,
    videoId: string,
    positionSeconds: number,
    bypass: boolean,
  ): Promise<VideoHeartbeatResponse> {
    if (!profileId) {
      throw new ForbiddenException(apiErrorBody("NO_ACTIVE_PROFILE", "Nenhum perfil ativo selecionado"));
    }

    // videoId aqui é o Video.id (chave primária, vindo de /videos/:id), que é
    // também a coluna VideoWatch.videoId (FK para Video.id). Checa a trava de
    // acesso ANTES de registrar progresso — sem isso, um perfil bloqueado
    // ainda conseguiria "assistir" e completar um vídeo premium via heartbeat
    // direto, mesmo sem nunca ter recebido o videoId real do YouTube.
    await this.videosService.assertVideoUnlockedById(videoId, profileId, bypass);

    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) {
      throw new NotFoundException(apiErrorBody("VIDEO_NOT_FOUND", "Vídeo não encontrado"));
    }

    const watchDate = utcMidnight(new Date());

    const existing = await prisma.videoWatch.findUnique({
      where: { profileId_videoId_watchDate: { profileId, videoId, watchDate } },
    });

    // watchedSeconds nunca decresce: protege contra heartbeats fora de ordem ou
    // rebobinar o player (Story 9.3, decisão 2 / caso de teste obrigatório).
    const watchedSeconds = Math.max(existing?.watchedSeconds ?? 0, positionSeconds);

    const alreadyCompleted = existing?.completedAt != null;
    // O backend — nunca o front — decide a conclusão: >= 80% da duração.
    const meetsThreshold = watchedSeconds >= COMPLETION_THRESHOLD * video.durationSeconds;
    const justCompleted = !alreadyCompleted && meetsThreshold;

    const completedAt = alreadyCompleted ? (existing?.completedAt ?? null) : justCompleted ? new Date() : null;

    // Upsert de VideoWatch + checagem do teto diário + criação do XpEvent numa
    // única transação: se a criação do XpEvent falhar, o vídeo NÃO fica preso
    // como "concluído sem XP" para sempre (REL-001, QA gate da Story 9.3).
    // $transaction interativo (não array, como em LessonsService.completeLesson)
    // porque a criação do XpEvent depende de uma leitura condicional (teto diário).
    const { xpAwarded, xpCapped } = await prisma.$transaction(async (tx) => {
      await tx.videoWatch.upsert({
        where: { profileId_videoId_watchDate: { profileId, videoId, watchDate } },
        create: { profileId, videoId, watchDate, watchedSeconds, completedAt },
        update: { watchedSeconds, completedAt },
      });

      if (!justCompleted) {
        return { xpAwarded: 0, xpCapped: false };
      }

      const cap = Number(process.env.VIDEO_XP_DAILY_CAP) || DEFAULT_VIDEO_XP_DAILY_CAP;
      const startOfToday = utcMidnight(new Date());

      // Teto diário é sobre a SOMA de XP de vídeos concluídos hoje, não contagem
      // (Story 9.3, decisão 4 — mesmo padrão de soma diária do AiUsageService).
      const todaySum = await tx.xpEvent.aggregate({
        _sum: { amount: true },
        where: { profileId, source: "VIDEO_COMPLETED", createdAt: { gte: startOfToday } },
      });
      const sumSoFar = todaySum._sum.amount ?? 0;

      if (sumSoFar + VIDEO_COMPLETION_XP > cap) {
        // Vídeo continua marcado como concluído (completedAt já preenchido acima),
        // mas nenhum XP novo é emitido.
        return { xpAwarded: 0, xpCapped: true };
      }

      await tx.xpEvent.create({
        data: { profileId, amount: VIDEO_COMPLETION_XP, source: "VIDEO_COMPLETED" },
      });
      return { xpAwarded: VIDEO_COMPLETION_XP, xpCapped: false };
    });

    return {
      watchedSeconds,
      completed: completedAt != null,
      xpAwarded,
      xpCapped,
    };
  }
}
