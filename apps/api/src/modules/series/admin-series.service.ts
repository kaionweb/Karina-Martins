import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma, type Series } from "@ipp/database";
import type { UpsertSeriesInput } from "@ipp/shared";
import { apiErrorBody } from "../../common/errors/api-error";
import { extractPlaylistId } from "../videos/admin-playlists.service";
import { SeriesSyncService, type SeriesSyncSummary } from "./series-sync.service";

const VISIBLE_EPISODES_FILTER = { status: "AVAILABLE" as const, hidden: false };

// Anotações de retorno explícitas evitam TS2742 (tipo inferido do Prisma
// Client não é "portável" fora de packages/database sem essa anotação).
export type SeriesWithEpisodesCount = Series & { episodesCount: number };
export type UpsertSeriesResult = { series: Series; sync: SeriesSyncSummary };

@Injectable()
export class AdminSeriesService {
  constructor(private readonly seriesSyncService: SeriesSyncService) {}

  async upsertSeries(input: UpsertSeriesInput): Promise<UpsertSeriesResult> {
    const playlistId = extractPlaylistId(input.playlistUrlOrId);

    // Regra automática de controle de acesso (só se aplica na CRIAÇÃO, nunca
    // no update — resync de uma série existente não deve mexer num
    // freeAfterTrial já definido, seja pela regra ou por override manual via
    // PATCH .../free-after-trial): a primeira série cadastrada de cada nível
    // nasce grátis-permanente.
    const isNewSeries = !(await prisma.series.findUnique({ where: { title: input.title }, select: { id: true } }));
    const hasFreeInLevel = isNewSeries
      ? await prisma.series.count({ where: { level: input.level, freeAfterTrial: true } })
      : 0;

    // Idempotente por título (mesmo espírito do upsert por playlistId em
    // AdminPlaylistsService) — reenviar o mesmo título atualiza os metadados
    // e a playlist em vez de criar uma série duplicada.
    const series = await prisma.series.upsert({
      where: { title: input.title },
      create: {
        title: input.title,
        emoji: input.emoji,
        level: input.level,
        ageRange: input.ageRange,
        seasons: input.seasons,
        playlistId,
        freeAfterTrial: hasFreeInLevel === 0,
      },
      update: {
        emoji: input.emoji,
        level: input.level,
        ageRange: input.ageRange,
        seasons: input.seasons,
        playlistId,
      },
    });

    const sync: SeriesSyncSummary = await this.seriesSyncService.syncSeries(series, input.season);

    return { series, sync };
  }

  async listSeriesWithCounts(): Promise<SeriesWithEpisodesCount[]> {
    const seriesList = await prisma.series.findMany({
      include: { _count: { select: { episodes: { where: VISIBLE_EPISODES_FILTER } } } },
      orderBy: { createdAt: "desc" },
    });

    return seriesList.map(({ _count, ...series }) => ({
      ...series,
      episodesCount: _count.episodes,
    }));
  }

  async getEpisodesForSeries(seriesId: string) {
    const series = await prisma.series.findUnique({ where: { id: seriesId } });
    if (!series) {
      throw new NotFoundException(apiErrorBody("SERIES_NOT_FOUND", "Série não encontrada"));
    }

    // Visão de admin: inclui ocultos e indisponíveis (a rota pública nunca mostra).
    return prisma.seriesEpisode.findMany({
      where: { seriesId },
      orderBy: [{ season: "asc" }, { number: "asc" }],
    });
  }

  // Override manual da regra automática de freeAfterTrial (ver upsertSeries)
  // — pra destacar outro item como grátis-permanente sem depender de qual
  // foi cadastrado primeiro no nível.
  async setFreeAfterTrial(seriesId: string, freeAfterTrial: boolean): Promise<Series> {
    const series = await prisma.series.findUnique({ where: { id: seriesId } });
    if (!series) {
      throw new NotFoundException(apiErrorBody("SERIES_NOT_FOUND", "Série não encontrada"));
    }

    return prisma.series.update({ where: { id: seriesId }, data: { freeAfterTrial } });
  }

  async setEpisodeHidden(episodeId: string, hidden: boolean) {
    const episode = await prisma.seriesEpisode.findUnique({ where: { id: episodeId } });
    if (!episode) {
      throw new NotFoundException(apiErrorBody("EPISODE_NOT_FOUND", "Episódio não encontrado"));
    }

    return prisma.seriesEpisode.update({ where: { id: episodeId }, data: { hidden } });
  }

  async setSeasonHidden(seriesId: string, season: number, hidden: boolean) {
    const series = await prisma.series.findUnique({ where: { id: seriesId } });
    if (!series) {
      throw new NotFoundException(apiErrorBody("SERIES_NOT_FOUND", "Série não encontrada"));
    }

    const result = await prisma.seriesEpisode.updateMany({
      where: { seriesId, season },
      data: { hidden },
    });

    return { updated: result.count };
  }

  // Exclusão definitiva — cascata do schema (onDelete: Cascade) remove
  // SeriesEpisode e SeriesEpisodeProgress junto. Sem soft-delete aqui: quem
  // quer reversível usa hidden (setEpisodeHidden/setSeasonHidden).
  async deleteSeries(seriesId: string) {
    const series = await prisma.series.findUnique({ where: { id: seriesId } });
    if (!series) {
      throw new NotFoundException(apiErrorBody("SERIES_NOT_FOUND", "Série não encontrada"));
    }

    await prisma.series.delete({ where: { id: seriesId } });
    return { deleted: true };
  }
}
