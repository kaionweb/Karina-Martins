import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@ipp/database";
import {
  computeVideoAccessStatus,
  trialDaysRemaining as computeTrialDaysRemaining,
  type AccessControlItem,
  type AccessStatus,
  type VideoDetail,
  type VideoLevel,
  type VideoListQuery,
  type VideoListResponse,
  type VideoSummary,
} from "@ipp/shared";
import { apiErrorBody } from "../../common/errors/api-error";

export interface ListeningAccessComputation {
  statusById: Record<string, AccessStatus>;
  trialActive: boolean;
  trialStartedAt: Date | null;
}

@Injectable()
export class VideosService {
  async listVideos(query: VideoListQuery, profileId: string | undefined, bypass: boolean): Promise<VideoListResponse> {
    const { level, skill, theme, ageRange } = query;

    const where = {
      status: "AVAILABLE" as const,
      playlist: { level, skill, theme, ageRange },
    };

    // Sem paginação (ver comentário em videoListQuerySchema): devolve o
    // catálogo inteiro que casa com os filtros, igual a /series.
    const videos = await prisma.video.findMany({
      where,
      include: { playlist: true },
      orderBy: { syncedAt: "desc" },
    });

    // A trava de acesso só existe pra skill=LISTENING — computa uma vez (a
    // query interna precisa do catálogo Listening inteiro pra calcular a
    // cascata de nível corretamente) e aplica só nos itens que forem dessa
    // skill.
    const needsAccessCheck = videos.some((video) => video.playlist.skill === "LISTENING");
    const listeningAccess = needsAccessCheck ? await this.computeListeningAccess(profileId, bypass) : null;

    const items: VideoSummary[] = videos.map((video) => this.toSummary(video, listeningAccess));

    return { items, page: 1, limit: items.length, total: items.length };
  }

  async listThemes(): Promise<string[]> {
    // Fonte canônica é CuratedPlaylist.theme, não uma derivação da página atual
    // de vídeos: com muitas playlists, a página 1 de /videos pode ser dominada
    // por uma só, escondendo os demais temas do filtro (achado desta sessão).
    const playlists = await prisma.curatedPlaylist.findMany({
      where: { active: true },
      select: { theme: true },
      distinct: ["theme"],
      orderBy: { theme: "asc" },
    });

    return playlists.map((p) => p.theme);
  }

  async getVideoById(id: string, profileId: string | undefined, bypass: boolean): Promise<VideoDetail> {
    // Retorna o vídeo independentemente do status (inclusive UNAVAILABLE):
    // é a tela que decide mostrar o player ou uma mensagem clara (Story 9.3, decisão 8).
    const video = await prisma.video.findUnique({
      where: { id },
      include: { playlist: true },
    });

    if (!video) {
      throw new NotFoundException(apiErrorBody("VIDEO_NOT_FOUND", "Vídeo não encontrado"));
    }

    await this.assertVideoUnlocked(video, profileId, bypass);

    const listeningAccess =
      video.playlist.skill === "LISTENING" ? await this.computeListeningAccess(profileId, bypass) : null;

    return { ...this.toSummary(video, listeningAccess), status: video.status };
  }

  // Lança 403 se o vídeo estiver bloqueado pro perfil — chamado ANTES de
  // devolver qualquer dado real (transcript, heartbeat de progresso). Só
  // vídeos de skill=LISTENING têm trava; as demais skills nunca bloqueiam.
  async assertVideoUnlockedById(videoId: string, profileId: string | undefined, bypass: boolean): Promise<void> {
    const video = await prisma.video.findUnique({ where: { id: videoId }, include: { playlist: true } });
    if (!video) {
      throw new NotFoundException(apiErrorBody("VIDEO_NOT_FOUND", "Vídeo não encontrado"));
    }
    await this.assertVideoUnlocked(video, profileId, bypass);
  }

  private async assertVideoUnlocked(
    video: { id: string; playlist: { skill: string } },
    profileId: string | undefined,
    bypass: boolean,
  ): Promise<void> {
    if (bypass || video.playlist.skill !== "LISTENING") return;

    const { statusById } = await this.computeListeningAccess(profileId, false);
    const status = statusById[video.id];
    if (status && status !== "unlocked") {
      throw new ForbiddenException(apiErrorBody("CONTENT_LOCKED", "Conteúdo bloqueado para este perfil"));
    }
  }

  // Usado pelo modo de comparação do admin (/admin/access-preview/listening)
  // — SEMPRE bypass=false: o admin nunca herda o próprio bypass ao simular
  // outro perfil.
  async getListeningAccessPreviewForProfile(profileId: string) {
    const { statusById, trialActive, trialStartedAt } = await this.computeListeningAccess(profileId, false);

    const videos = await prisma.video.findMany({
      where: { status: "AVAILABLE", playlist: { skill: "LISTENING" } },
      include: { playlist: true },
      orderBy: { syncedAt: "desc" },
    });

    return {
      videos: videos.map((video) => this.toSummary(video, { statusById, trialActive, trialStartedAt })),
      statusById,
      trialActive,
      trialDaysRemaining: computeTrialDaysRemaining(trialStartedAt),
    };
  }

  // Núcleo do controle de acesso de Listening: reúne TODOS os vídeos dessa
  // skill (independente de paginação/filtros — a cascata de nível precisa do
  // catálogo inteiro) e delega a computeVideoAccessStatus, o MESMO motor
  // genérico usado por Series (ver @ipp/shared), pra nunca haver divergência
  // entre o que a tela mostra e o que a API realmente libera.
  private async computeListeningAccess(
    profileId: string | undefined,
    bypass: boolean,
  ): Promise<ListeningAccessComputation> {
    const listeningVideos = await prisma.video.findMany({
      where: { status: "AVAILABLE", playlist: { skill: "LISTENING" } },
      select: { id: true, playlist: { select: { level: true, freeAfterTrial: true } } },
    });

    const videoIds = listeningVideos.map((video) => video.id);
    const watchRows = profileId
      ? await prisma.videoWatch.findMany({
          where: { profileId, videoId: { in: videoIds } },
          select: { videoId: true, completedAt: true },
        })
      : [];

    const startedIds = new Set(watchRows.map((row) => row.videoId));
    const completedIds = new Set(watchRows.filter((row) => row.completedAt != null).map((row) => row.videoId));

    // hasContent sempre true: diferente de Series (onde uma série pode não
    // ter episódios ainda), um Video já É o conteúdo — não existe "vídeo
    // vazio" que precise ser ignorado na cascata de nível.
    const items: AccessControlItem<VideoLevel>[] = listeningVideos.map((video) => ({
      id: video.id,
      level: video.playlist.level,
      hasContent: true,
      completed: completedIds.has(video.id),
      freeAfterTrial: video.playlist.freeAfterTrial,
      hasStartedProgress: startedIds.has(video.id),
    }));

    const profile = profileId
      ? await prisma.profile.findUnique({ where: { id: profileId }, select: { trialStartedAt: true } })
      : null;
    const trialStartedAt = profile?.trialStartedAt ?? null;

    const { statusById, trialActive } = computeVideoAccessStatus(items, { trialStartedAt }, bypass);

    return { statusById, trialActive, trialStartedAt };
  }

  private toSummary(
    video: {
      id: string;
      videoId: string;
      title: string;
      channel: string;
      durationSeconds: number;
      thumbnailUrl: string;
      playlist: { level: VideoLevel; ageRange: string; skill: string; theme: string; freeAfterTrial: boolean };
    },
    listeningAccess: ListeningAccessComputation | null,
  ): VideoSummary {
    const isListening = video.playlist.skill === "LISTENING";
    const accessStatus: AccessStatus = isListening
      ? (listeningAccess?.statusById[video.id] ?? "locked-premium")
      : "unlocked";
    const isUnlocked = accessStatus === "unlocked";

    return {
      id: video.id,
      // Trava de verdade: sem o videoId real, não dá pra montar o embed do
      // YouTube mesmo inspecionando a resposta bruta da API.
      videoId: isUnlocked ? video.videoId : null,
      title: video.title,
      channel: video.channel,
      durationSeconds: video.durationSeconds,
      thumbnailUrl: video.thumbnailUrl,
      level: video.playlist.level,
      ageRange: video.playlist.ageRange,
      skill: video.playlist.skill as VideoSummary["skill"],
      theme: video.playlist.theme,
      freeAfterTrial: video.playlist.freeAfterTrial,
      accessStatus,
    };
  }
}
