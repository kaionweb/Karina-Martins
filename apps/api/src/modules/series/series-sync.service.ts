import { Injectable } from "@nestjs/common";
import { prisma, type Series } from "@ipp/database";
import { YoutubeClient } from "../videos/youtube.client";

const MAX_IDS_PER_VIDEOS_LIST_CALL = 50;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function parseIsoDurationToSeconds(iso: string): number {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) {
    return 0;
  }
  const [, hours, minutes, seconds] = match;
  return (Number(hours) || 0) * 3600 + (Number(minutes) || 0) * 60 + (Number(seconds) || 0);
}

export interface SeriesSyncSummary {
  playlistId: string;
  episodesAvailable: number;
}

// Mesma lógica de YoutubeSyncService (apps/api/src/modules/videos), adaptada
// pra gravar em SeriesEpisode em vez de Video: a ordem de retorno de
// playlistItems.list É a ordem dos episódios (por isso `number` = índice + 1,
// não vem de metadata nenhuma do YouTube).
@Injectable()
export class SeriesSyncService {
  constructor(private readonly youtubeClient: YoutubeClient) {}

  async syncSeries(series: Series, season: number): Promise<SeriesSyncSummary> {
    if (!series.playlistId) {
      return { playlistId: "", episodesAvailable: 0 };
    }

    const videoIds: string[] = [];
    let pageToken: string | undefined;

    do {
      const page = await this.youtubeClient.listPlaylistItems(series.playlistId, pageToken);
      videoIds.push(...page.videoIds);
      pageToken = page.nextPageToken;
    } while (pageToken);

    const metadataById = new Map<string, Awaited<ReturnType<YoutubeClient["listVideos"]>>[number]>();
    for (const idsBatch of chunk(videoIds, MAX_IDS_PER_VIDEOS_LIST_CALL)) {
      const metadata = await this.youtubeClient.listVideos(idsBatch);
      for (const item of metadata) {
        metadataById.set(item.id, item);
      }
    }

    const availableVideoIds: string[] = [];

    for (const [index, videoId] of videoIds.entries()) {
      const metadata = metadataById.get(videoId);
      if (!metadata || metadata.privacyStatus === "private") {
        continue;
      }

      availableVideoIds.push(videoId);
      const number = index + 1;

      await prisma.seriesEpisode.upsert({
        where: { videoId },
        create: {
          videoId,
          seriesId: series.id,
          season,
          number,
          title: metadata.title,
          durationSeconds: parseIsoDurationToSeconds(metadata.durationIso),
          thumbnailUrl: metadata.thumbnailUrl,
          status: "AVAILABLE",
        },
        update: {
          season,
          number,
          title: metadata.title,
          durationSeconds: parseIsoDurationToSeconds(metadata.durationIso),
          thumbnailUrl: metadata.thumbnailUrl,
          status: "AVAILABLE",
          syncedAt: new Date(),
        },
      });
    }

    // Escopado por temporada: resincronizar a temporada 2 não pode marcar a 1
    // como indisponível só porque os vídeos dela não vieram nesta chamada.
    await prisma.seriesEpisode.updateMany({
      where: {
        seriesId: series.id,
        season,
        status: "AVAILABLE",
        videoId: { notIn: availableVideoIds },
      },
      data: { status: "UNAVAILABLE" },
    });

    return { playlistId: series.playlistId, episodesAvailable: availableVideoIds.length };
  }
}
