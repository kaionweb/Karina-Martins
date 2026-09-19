import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@ipp/database";
import type { UpsertFilmeInput } from "@ipp/shared";
import { apiErrorBody } from "../../common/errors/api-error";

/**
 * Extrai o id do vídeo do YouTube de uma entrada que pode ser uma URL colada
 * ou o próprio id já puro. Espelha extractPlaylistId (admin-playlists.service),
 * adaptado para vídeos:
 * - URL absoluta `youtube.com/watch?v=XXXX` → valor de `v`.
 * - URL absoluta `youtu.be/XXXX` → primeiro segmento do path.
 * - URL absoluta `youtube.com/embed/XXXX` ou `/shorts/XXXX` → segmento seguinte.
 * - URL absoluta sem nada disso → a própria string (trim).
 * - String que não é URL absoluta (id puro, ou URL colada sem protocolo tipo
 *   "watch?v=XXXX") → tenta `v=` via regex antes de desistir; sem match,
 *   retorna a própria string (trim) — cobre o id puro.
 *
 * É normalização, não validação — por isso vive no service e não no zod.
 */
export function extractYoutubeVideoId(input: string): string {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    if (url.hostname.replace(/^www\./, "") === "youtu.be") {
      const segment = url.pathname.split("/").filter(Boolean)[0];
      return segment ?? trimmed;
    }
    const v = url.searchParams.get("v");
    if (v) return v;
    const segments = url.pathname.split("/").filter(Boolean);
    const markerIndex = segments.findIndex((s) => s === "embed" || s === "shorts");
    if (markerIndex !== -1 && segments[markerIndex + 1]) {
      return segments[markerIndex + 1];
    }
    return trimmed;
  } catch {
    const match = /[?&]v=([^&]+)/.exec(trimmed);
    return match ? decodeURIComponent(match[1]) : trimmed;
  }
}

/**
 * Converte a duração digitada no admin em segundos. Aceita:
 * - segundos puros: "2550" → 2550
 * - "mm:ss": "42:30" → 2550
 * - "hh:mm:ss": "1:05:00" → 3900
 * Cada campo pode ter espaços; qualquer parte não-numérica ou negativa é erro.
 * Normalização, não validação de formato exato — por isso vive no service.
 */
export function parseDurationToSeconds(input: string): number {
  const trimmed = input.trim();
  const parts = trimmed.split(":").map((part) => Number(part.trim()));
  if (parts.length === 0 || parts.length > 3 || parts.some((n) => !Number.isFinite(n) || n < 0)) {
    throw new BadRequestException(
      apiErrorBody("INVALID_DURATION", "Duração inválida. Use segundos, mm:ss ou hh:mm:ss."),
    );
  }
  const seconds = parts.reduce((acc, part) => acc * 60 + part, 0);
  return Math.floor(seconds);
}

@Injectable()
export class AdminFilmesService {
  // Idempotente por videoId (mesmo espírito do upsert por playlistId/título em
  // playlists/séries) — reenviar o mesmo vídeo atualiza os metadados em vez de
  // criar um filme duplicado.
  async upsertFilme(input: UpsertFilmeInput) {
    const videoId = extractYoutubeVideoId(input.videoUrlOrId);
    const durationSeconds = parseDurationToSeconds(input.duration);

    return prisma.filme.upsert({
      where: { videoId },
      create: {
        title: input.title,
        emoji: input.emoji,
        level: input.level,
        ageRange: input.ageRange,
        videoId,
        durationSeconds,
      },
      update: {
        title: input.title,
        emoji: input.emoji,
        level: input.level,
        ageRange: input.ageRange,
        durationSeconds,
      },
    });
  }

  async listFilmes() {
    return prisma.filme.findMany({ orderBy: { createdAt: "desc" } });
  }

  // Exclusão definitiva — sem soft-delete (mesma decisão de playlists/séries).
  async deleteFilme(id: string) {
    const filme = await prisma.filme.findUnique({ where: { id } });
    if (!filme) {
      throw new NotFoundException(apiErrorBody("FILME_NOT_FOUND", "Filme não encontrado"));
    }

    await prisma.filme.delete({ where: { id } });
    return { deleted: true };
  }
}
