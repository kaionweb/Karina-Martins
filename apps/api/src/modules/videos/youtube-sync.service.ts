import { Injectable, Logger } from "@nestjs/common";
import { prisma, type CuratedPlaylist } from "@ipp/database";
import { YoutubeClient } from "./youtube.client";

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

export interface PlaylistSyncSummary {
  playlistId: string;
  videosAvailable: number;
}

/**
 * Retorno interno de syncPlaylist(): carrega o resumo observável de uma
 * playlist MAIS a contagem de units de quota do YouTube consumidas ao
 * sincronizá-la. syncAll() agrega `unitsConsumed` no SyncResult final sem
 * vazá-lo dentro de cada item de `summary` — assim o contrato observável de
 * POST /internal/cron/videos-sync (e de POST /admin/playlists) permanece
 * exatamente {playlistId, videosAvailable}.
 */
export interface PlaylistSyncResult {
  summary: PlaylistSyncSummary;
  unitsConsumed: number;
}

export interface SyncResult {
  playlistsProcessed: number;
  unitsConsumed: number;
  summary: PlaylistSyncSummary[];
  failedPlaylistIds: string[];
}

@Injectable()
export class YoutubeSyncService {
  private readonly logger = new Logger(YoutubeSyncService.name);

  constructor(private readonly youtubeClient: YoutubeClient) {}

  /**
   * Sincroniza UMA playlist com o YouTube: pagina listPlaylistItems, busca
   * metadata em lotes via listVideos, faz upsert dos Video disponíveis e marca
   * como UNAVAILABLE os que sumiram/ficaram privados. Reutilizado por syncAll()
   * (loop com try/catch de isolamento por playlist) e pelo endpoint admin
   * (sincroniza só a playlist recém-criada).
   */
  async syncPlaylist(playlist: CuratedPlaylist): Promise<PlaylistSyncResult> {
    let unitsConsumed = 0;

    const videoIds: string[] = [];
    let pageToken: string | undefined;

    do {
      const page = await this.youtubeClient.listPlaylistItems(playlist.playlistId, pageToken);
      unitsConsumed += 1;
      videoIds.push(...page.videoIds);
      pageToken = page.nextPageToken;
    } while (pageToken);

    const metadataById = new Map<string, Awaited<ReturnType<YoutubeClient["listVideos"]>>[number]>();
    for (const idsBatch of chunk(videoIds, MAX_IDS_PER_VIDEOS_LIST_CALL)) {
      const metadata = await this.youtubeClient.listVideos(idsBatch);
      unitsConsumed += 1;
      for (const item of metadata) {
        metadataById.set(item.id, item);
      }
    }

    const availableVideoIds: string[] = [];

    for (const videoId of videoIds) {
      const metadata = metadataById.get(videoId);
      if (!metadata || metadata.privacyStatus === "private") {
        continue;
      }

      availableVideoIds.push(videoId);

      await prisma.video.upsert({
        where: { videoId },
        create: {
          videoId,
          playlistId: playlist.id,
          title: metadata.title,
          channel: metadata.channelTitle,
          durationSeconds: parseIsoDurationToSeconds(metadata.durationIso),
          thumbnailUrl: metadata.thumbnailUrl,
          status: "AVAILABLE",
        },
        update: {
          title: metadata.title,
          channel: metadata.channelTitle,
          durationSeconds: parseIsoDurationToSeconds(metadata.durationIso),
          thumbnailUrl: metadata.thumbnailUrl,
          status: "AVAILABLE",
          syncedAt: new Date(),
        },
      });
    }

    // Guarda contra falso-zeramento: só marca vídeos como UNAVAILABLE quando a
    // playlist de fato devolveu itens nesta rodada. Se listPlaylistItems() voltar
    // vazio (glitch de API, quota parcial, mock de teste), videoIds fica vazio e
    // NÃO tocamos no status dos vídeos já cadastrados — evita repetir o bug real
    // que zerou "Inglês com Histórias" (ver PlaylistSyncResult acima).
    if (videoIds.length > 0) {
      await prisma.video.updateMany({
        where: {
          playlistId: playlist.id,
          status: "AVAILABLE",
          videoId: { notIn: availableVideoIds },
        },
        data: { status: "UNAVAILABLE" },
      });
    }

    return {
      summary: { playlistId: playlist.playlistId, videosAvailable: availableVideoIds.length },
      unitsConsumed,
    };
  }

  async syncAll(): Promise<SyncResult> {
    const playlists = await prisma.curatedPlaylist.findMany({ where: { active: true } });

    let unitsConsumed = 0;
    const summary: PlaylistSyncSummary[] = [];
    const failedPlaylistIds: string[] = [];

    for (const playlist of playlists) {
      try {
        const result = await this.syncPlaylist(playlist);
        unitsConsumed += result.unitsConsumed;
        summary.push(result.summary);
      } catch (error) {
        // Isola falha por playlist: um erro (quota, playlist removida, timeout) não
        // pode abortar a sincronização das demais playlists no mesmo cron run.
        failedPlaylistIds.push(playlist.playlistId);
        this.logger.error(
          `Falha ao sincronizar playlist ${playlist.playlistId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    this.logger.log(`Sincronização concluída: ${playlists.length} playlist(s), ${unitsConsumed} units consumidas`);

    return { playlistsProcessed: playlists.length, unitsConsumed, summary, failedPlaylistIds };
  }
}
