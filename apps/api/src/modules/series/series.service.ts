import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { prisma, type Series } from "@ipp/database";
import {
  computeSeriesAccessStatus,
  trialDaysRemaining as computeTrialDaysRemaining,
  type AccessControlItem,
  type AccessStatus,
  type SeriesLevel,
} from "@ipp/shared";
import { apiErrorBody } from "../../common/errors/api-error";

// Episódios ocultados pelo admin ou marcados indisponíveis (removidos do
// YouTube) nunca aparecem pra fora do painel admin.
const VISIBLE_EPISODES_FILTER = { status: "AVAILABLE" as const, hidden: false };

// Anotação de retorno explícita evita TS2742 (o tipo inferido do Prisma
// Client não é "portável" fora de packages/database sem essa anotação).
export type SeriesWithEpisodesCount = Series & {
  episodesCount: number;
  completed: boolean;
  hasStartedProgress: boolean;
};

export interface SeriesAccessComputation {
  seriesList: SeriesWithEpisodesCount[];
  statusById: Record<string, AccessStatus>;
  trialActive: boolean;
  trialStartedAt: Date | null;
}

@Injectable()
export class SeriesService {
  // completed/hasStartedProgress exigem profileId (rota autenticada) — usados
  // pela trava de progressão por nível e pelo grandfathering do controle de
  // acesso (ver computeSeriesAccessStatus em @ipp/shared). Uma série sem
  // episódios visíveis nunca conta como concluída (evita série vazia
  // "destravando" o próximo nível de graça).
  async listSeries(profileId?: string): Promise<SeriesWithEpisodesCount[]> {
    const seriesList = await prisma.series.findMany({
      include: { episodes: { where: VISIBLE_EPISODES_FILTER, select: { id: true } } },
      orderBy: { createdAt: "asc" },
    });

    const allEpisodeIds = seriesList.flatMap((series) => series.episodes.map((episode) => episode.id));
    const watchedProgress = profileId
      ? await prisma.seriesEpisodeProgress.findMany({
          where: { profileId, episodeId: { in: allEpisodeIds } },
          select: { episodeId: true },
        })
      : [];
    const watchedEpisodeIds = new Set(watchedProgress.map((progress) => progress.episodeId));

    return seriesList.map(({ episodes, ...series }) => ({
      ...series,
      episodesCount: episodes.length,
      completed: episodes.length > 0 && episodes.every((episode) => watchedEpisodeIds.has(episode.id)),
      hasStartedProgress: episodes.some((episode) => watchedEpisodeIds.has(episode.id)),
    }));
  }

  // Núcleo do controle de acesso: reaproveita listSeries (mesma query, sem
  // duplicar a lógica de progresso) e delega a decisão de trial/premium/
  // grandfathering/trava de nível pra computeSeriesAccessStatus — a MESMA
  // função usada pelo hook do web (useAccessControl), pra nunca haver
  // divergência entre o que a tela mostra e o que a API realmente libera.
  //
  // bypass precisa ter sido calculado no controller a partir de isAdminUser
  // (sessão autenticada) — nunca aceito como parâmetro vindo do client.
  async computeAccessStatus(profileId: string | undefined, bypass: boolean): Promise<SeriesAccessComputation> {
    const seriesList = await this.listSeries(profileId);
    const items: AccessControlItem<SeriesLevel>[] = seriesList.map((series) => ({
      id: series.id,
      level: series.level,
      hasContent: series.episodesCount > 0,
      completed: series.completed,
      freeAfterTrial: series.freeAfterTrial,
      hasStartedProgress: series.hasStartedProgress,
    }));

    const profile = profileId
      ? await prisma.profile.findUnique({ where: { id: profileId }, select: { trialStartedAt: true } })
      : null;
    const trialStartedAt = profile?.trialStartedAt ?? null;

    const { statusById, trialActive } = computeSeriesAccessStatus(items, { trialStartedAt }, bypass);

    return { seriesList, statusById, trialActive, trialStartedAt };
  }

  // Usado pelo modo de comparação do admin (/admin/access-preview) — SEMPRE
  // bypass=false: o admin nunca herda o próprio bypass ao simular outro perfil.
  async getAccessPreviewForProfile(profileId: string) {
    const { seriesList, statusById, trialActive, trialStartedAt } = await this.computeAccessStatus(profileId, false);
    return {
      series: seriesList,
      statusById,
      trialActive,
      trialDaysRemaining: computeTrialDaysRemaining(trialStartedAt),
    };
  }

  // Lança 403 se a série estiver bloqueada pro perfil (trial expirado, não é
  // freeAfterTrial, sem progresso iniciado e nível anterior incompleto).
  // Chamado ANTES de devolver qualquer dado real de conteúdo (episódios,
  // transcript, toggle de assistido) — o cadeado da UI é só cosmético, quem
  // garante que o aluno não acessa a resposta bruta da API é esta checagem.
  private async assertSeriesUnlocked(seriesId: string, profileId: string | undefined, bypass: boolean): Promise<void> {
    if (bypass) return;

    const { statusById } = await this.computeAccessStatus(profileId, false);
    const status = statusById[seriesId];
    if (status && status !== "unlocked") {
      throw new ForbiddenException(apiErrorBody("CONTENT_LOCKED", "Conteúdo bloqueado para este perfil"));
    }
  }

  async getEpisodesForSeries(seriesId: string, profileId: string | undefined, bypass: boolean) {
    const series = await prisma.series.findUnique({ where: { id: seriesId } });
    if (!series) {
      throw new NotFoundException(apiErrorBody("SERIES_NOT_FOUND", "Série não encontrada"));
    }

    await this.assertSeriesUnlocked(seriesId, profileId, bypass);

    const episodes = await prisma.seriesEpisode.findMany({
      where: { seriesId, ...VISIBLE_EPISODES_FILTER },
      orderBy: [{ season: "asc" }, { number: "asc" }],
    });

    if (!profileId) {
      return episodes.map((episode) => ({ ...episode, watched: false }));
    }

    const watchedProgress = await prisma.seriesEpisodeProgress.findMany({
      where: { profileId, episodeId: { in: episodes.map((episode) => episode.id) } },
    });
    const watchedEpisodeIds = new Set(watchedProgress.map((progress) => progress.episodeId));

    return episodes.map((episode) => ({ ...episode, watched: watchedEpisodeIds.has(episode.id) }));
  }

  // Resolve o videoId (YouTube) de um episódio pra rota de transcript (feature
  // de repetição de frase), checando a trava de acesso da série-dona antes.
  async getEpisodeYoutubeIdForTranscript(
    episodeId: string,
    profileId: string | undefined,
    bypass: boolean,
  ): Promise<string> {
    const episode = await prisma.seriesEpisode.findUnique({
      where: { id: episodeId },
      select: { videoId: true, seriesId: true },
    });
    if (!episode) {
      throw new NotFoundException(apiErrorBody("EPISODE_NOT_FOUND", "Episódio não encontrado"));
    }

    await this.assertSeriesUnlocked(episode.seriesId, profileId, bypass);

    return episode.videoId;
  }

  // Toggle: existência do registro = assistido (mesmo espírito de ProfileBadge).
  async toggleWatched(profileId: string | undefined, episodeId: string, bypass: boolean) {
    if (!profileId) {
      throw new ForbiddenException(apiErrorBody("NO_ACTIVE_PROFILE", "Nenhum perfil ativo selecionado"));
    }

    const episode = await prisma.seriesEpisode.findUnique({ where: { id: episodeId } });
    if (!episode) {
      throw new NotFoundException(apiErrorBody("EPISODE_NOT_FOUND", "Episódio não encontrado"));
    }

    await this.assertSeriesUnlocked(episode.seriesId, profileId, bypass);

    const existing = await prisma.seriesEpisodeProgress.findUnique({
      where: { profileId_episodeId: { profileId, episodeId } },
    });

    if (existing) {
      await prisma.seriesEpisodeProgress.delete({ where: { id: existing.id } });
      return { watched: false };
    }

    await prisma.seriesEpisodeProgress.create({ data: { profileId, episodeId } });
    return { watched: true };
  }
}
