import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@ipp/database";
import type { CreatePlaylistInput } from "@ipp/shared";
import { apiErrorBody } from "../../common/errors/api-error";
import { YoutubeSyncService, type PlaylistSyncSummary } from "./youtube-sync.service";

/**
 * Extrai o playlistId real de uma entrada que pode ser uma URL do YouTube
 * (com ?list= ou &list=) ou o próprio id já puro.
 * - URL absoluta válida com parâmetro `list` → retorna o valor de `list`.
 * - URL absoluta válida sem `list` → retorna a própria string (trim).
 * - String que não é URL absoluta (id puro, ou URL colada sem protocolo tipo
 *   "playlist?list=PLxxx") → tenta extrair `list=` via regex antes de
 *   desistir; sem match, retorna a própria string (trim) — cobre o caso de
 *   id puro (ARCH-001, QA gate Story 10.5).
 *
 * É normalização, não validação — por isso vive no service e não no zod.
 */
export function extractPlaylistId(input: string): string {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    return url.searchParams.get("list") ?? trimmed;
  } catch {
    const match = /[?&]list=([^&]+)/.exec(trimmed);
    return match ? decodeURIComponent(match[1]) : trimmed;
  }
}

@Injectable()
export class AdminPlaylistsService {
  constructor(private readonly youtubeSyncService: YoutubeSyncService) {}

  async createOrUpdatePlaylist(
    input: CreatePlaylistInput,
  ): Promise<{ playlist: Awaited<ReturnType<typeof prisma.curatedPlaylist.upsert>>; sync: PlaylistSyncSummary }> {
    const playlistId = extractPlaylistId(input.playlistUrlOrId);

    // Regra automática de controle de acesso (só na CRIAÇÃO, nunca no
    // update — resync de uma playlist existente não deve mexer num
    // freeAfterTrial já definido pela regra ou por override manual via PATCH
    // .../free-after-trial). Só se aplica à skill LISTENING, que é a única
    // com trial/premium por enquanto (ver VideosService).
    const isNewPlaylist = !(await prisma.curatedPlaylist.findUnique({ where: { playlistId }, select: { id: true } }));
    const hasFreeInLevel =
      isNewPlaylist && input.skill === "LISTENING"
        ? await prisma.curatedPlaylist.count({ where: { skill: "LISTENING", level: input.level, freeAfterTrial: true } })
        : 1; // qualquer skill != LISTENING nunca nasce freeAfterTrial=true automaticamente

    // Idempotente (mesmo espírito do seed): reenviar o mesmo playlistId atualiza
    // os metadados em vez de dar erro de duplicata.
    const playlist = await prisma.curatedPlaylist.upsert({
      where: { playlistId },
      create: {
        playlistId,
        channel: input.channel,
        level: input.level,
        ageRange: input.ageRange,
        skill: input.skill,
        theme: input.theme,
        freeAfterTrial: hasFreeInLevel === 0,
      },
      update: {
        channel: input.channel,
        level: input.level,
        ageRange: input.ageRange,
        skill: input.skill,
        theme: input.theme,
      },
    });

    const { summary } = await this.youtubeSyncService.syncPlaylist(playlist);

    return { playlist, sync: summary };
  }

  // Override manual da regra automática de freeAfterTrial.
  async setFreeAfterTrial(playlistId: string, freeAfterTrial: boolean) {
    const playlist = await prisma.curatedPlaylist.findUnique({ where: { id: playlistId } });
    if (!playlist) {
      throw new NotFoundException(apiErrorBody("PLAYLIST_NOT_FOUND", "Playlist não encontrada"));
    }

    return prisma.curatedPlaylist.update({ where: { id: playlistId }, data: { freeAfterTrial } });
  }

  async listPlaylistsWithCounts() {
    const playlists = await prisma.curatedPlaylist.findMany({
      include: { _count: { select: { videos: true } } },
      orderBy: { createdAt: "desc" },
    });

    return playlists.map(({ _count, ...playlist }) => ({
      ...playlist,
      videosCount: _count.videos,
    }));
  }

  // Exclusão definitiva — cascata do schema (onDelete: Cascade) remove Video e
  // VideoWatch junto. Sem soft-delete: mesma decisão tomada em séries.
  async deletePlaylist(playlistId: string) {
    const playlist = await prisma.curatedPlaylist.findUnique({ where: { id: playlistId } });
    if (!playlist) {
      throw new NotFoundException(apiErrorBody("PLAYLIST_NOT_FOUND", "Playlist não encontrada"));
    }

    await prisma.curatedPlaylist.delete({ where: { id: playlistId } });
    return { deleted: true };
  }
}
