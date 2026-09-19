import type {
  AccessPreviewResponse,
  AdminProfileOption,
  AdminSeriesEpisode,
  CreatePlaylistInput,
  FilmeLevel,
  ListeningAccessPreviewResponse,
  PendingTranscriptGroup,
  ReviewTranscriptSentenceInput,
  SaveTranscriptInput,
  SeriesLevel,
  TranscriptSentence,
  TranscriptSource,
  UpsertFilmeInput,
  UpsertSeriesInput,
  VideoLevel,
  VideoSkill,
} from "@ipp/shared";
import { authenticatedFetch } from "@/lib/api/catalog";

// Usado só pra decidir se a UI mostra atalhos de admin (ex.: tela de Perfil)
// — a checagem de verdade continua sendo o guard da API (ADMIN_EMAIL,
// fail-closed); qualquer erro aqui (403, rede etc.) conta como "não é admin".
export async function checkIsAdmin(): Promise<boolean> {
  try {
    await authenticatedFetch("/admin/whoami");
    return true;
  } catch {
    return false;
  }
}

// Playlist curada como devolvida por GET /admin/playlists (CuratedPlaylist do
// Prisma + contagem de vídeos). Datas chegam serializadas como string via JSON.
export interface AdminPlaylist {
  id: string;
  playlistId: string;
  channel: string;
  active: boolean;
  level: VideoLevel;
  ageRange: string;
  skill: VideoSkill;
  theme: string;
  createdAt: string;
  videosCount: number;
  freeAfterTrial: boolean;
}

export interface PlaylistSyncSummary {
  playlistId: string;
  videosAvailable: number;
}

export interface CreatePlaylistResult {
  playlist: Omit<AdminPlaylist, "videosCount">;
  sync: PlaylistSyncSummary;
}

export function createPlaylist(input: CreatePlaylistInput): Promise<CreatePlaylistResult> {
  return authenticatedFetch("/admin/playlists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function listPlaylists(): Promise<AdminPlaylist[]> {
  return authenticatedFetch("/admin/playlists");
}

export function deletePlaylist(playlistId: string): Promise<{ deleted: boolean }> {
  return authenticatedFetch(`/admin/playlists/${playlistId}`, { method: "DELETE" });
}

// Override manual da regra automática de freeAfterTrial (primeira playlist
// LISTENING de cada nível nasce grátis-permanente — ver AdminPlaylistsService).
export function setPlaylistFreeAfterTrial(playlistId: string, freeAfterTrial: boolean): Promise<AdminPlaylist> {
  return authenticatedFetch(`/admin/playlists/${playlistId}/free-after-trial`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ freeAfterTrial }),
  });
}

// Catálogo de Listening + status de acesso calculados como o perfil escolhido
// veria de verdade (bypass sempre false no server).
export function getListeningAccessPreview(profileId: string): Promise<ListeningAccessPreviewResponse> {
  return authenticatedFetch(`/admin/access-preview/listening?profileId=${encodeURIComponent(profileId)}`);
}

// Série curada como devolvida por GET /admin/series (Series do Prisma +
// contagem de episódios). Datas chegam serializadas como string via JSON.
export interface AdminSeries {
  id: string;
  title: string;
  emoji: string;
  level: SeriesLevel;
  ageRange: string;
  seasons: number;
  playlistId: string | null;
  createdAt: string;
  episodesCount: number;
}

export interface SeriesSyncSummary {
  playlistId: string;
  episodesAvailable: number;
}

export interface UpsertSeriesResult {
  series: Omit<AdminSeries, "episodesCount">;
  sync: SeriesSyncSummary;
}

export function upsertSeries(input: UpsertSeriesInput): Promise<UpsertSeriesResult> {
  return authenticatedFetch("/admin/series", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function listAdminSeries(): Promise<AdminSeries[]> {
  return authenticatedFetch("/admin/series");
}

export function getAdminSeriesEpisodes(seriesId: string): Promise<AdminSeriesEpisode[]> {
  return authenticatedFetch(`/admin/series/${seriesId}/episodes`);
}

export function setEpisodeHidden(episodeId: string, hidden: boolean): Promise<AdminSeriesEpisode> {
  return authenticatedFetch(`/admin/series/episodes/${episodeId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hidden }),
  });
}

export function setSeasonHidden(seriesId: string, season: number, hidden: boolean): Promise<{ updated: number }> {
  return authenticatedFetch(`/admin/series/seasons/${seriesId}/${season}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hidden }),
  });
}

// Exclusão definitiva da série (episódios/progresso vão junto por cascata) —
// sem desfazer, diferente de setEpisodeHidden/setSeasonHidden.
export function deleteSeries(seriesId: string): Promise<{ deleted: boolean }> {
  return authenticatedFetch(`/admin/series/${seriesId}`, { method: "DELETE" });
}

// Override manual da regra automática de freeAfterTrial (primeira série de
// cada nível nasce grátis-permanente — ver AdminSeriesService.upsertSeries).
export function setSeriesFreeAfterTrial(seriesId: string, freeAfterTrial: boolean): Promise<AdminSeries> {
  return authenticatedFetch(`/admin/series/${seriesId}/free-after-trial`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ freeAfterTrial }),
  });
}

// --- Modo de comparação (controle de acesso) ---

// Perfis reais de toda a plataforma pro dropdown do modo comparação — nunca
// um profile de teste fixo.
export function listAdminProfiles(): Promise<AdminProfileOption[]> {
  return authenticatedFetch("/admin/profiles");
}

// Catálogo + status de acesso calculados como o perfil escolhido veria de
// verdade (bypass sempre false no server, mesmo a chamada vindo do admin).
export function getAccessPreview(profileId: string): Promise<AccessPreviewResponse> {
  return authenticatedFetch(`/admin/access-preview?profileId=${encodeURIComponent(profileId)}`);
}

// Filme como devolvido por GET /admin/filmes (Filme do Prisma). Datas chegam
// serializadas como string via JSON.
export interface AdminFilme {
  id: string;
  title: string;
  emoji: string;
  level: FilmeLevel;
  ageRange: string;
  videoId: string;
  durationSeconds: number;
  thumbnailUrl: string | null;
  createdAt: string;
}

export function upsertFilme(input: UpsertFilmeInput): Promise<AdminFilme> {
  return authenticatedFetch("/admin/filmes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function listAdminFilmes(): Promise<AdminFilme[]> {
  return authenticatedFetch("/admin/filmes");
}

// Exclusão definitiva do filme — sem desfazer.
export function deleteFilme(id: string): Promise<{ deleted: boolean }> {
  return authenticatedFetch(`/admin/filmes/${id}`, { method: "DELETE" });
}

// --- Transcripts (feature de repetição de frase) ---

// Vídeos avulsos + episódios de série, cada um pelo seu youtubeVideoId, para o
// dropdown do admin de transcripts.
export function listTranscriptSources(): Promise<TranscriptSource[]> {
  return authenticatedFetch("/admin/transcripts/sources");
}

export function getAdminTranscript(youtubeVideoId: string): Promise<TranscriptSentence[]> {
  return authenticatedFetch(`/admin/transcripts/${youtubeVideoId}`);
}

// Substitui todas as frases do vídeo (replace).
export function saveTranscript(
  youtubeVideoId: string,
  input: SaveTranscriptInput,
): Promise<TranscriptSentence[]> {
  return authenticatedFetch(`/admin/transcripts/${youtubeVideoId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

// Frases pendentes de revisão (needsReview: true), agrupadas por vídeo/episódio/filme.
export function listPendingTranscripts(): Promise<PendingTranscriptGroup[]> {
  return authenticatedFetch("/admin/transcripts/pending");
}

// Corrige UMA frase e marca needsReview: false — não mexe nas demais do vídeo.
export function reviewTranscriptSentence(
  sentenceId: string,
  input: ReviewTranscriptSentenceInput,
): Promise<TranscriptSentence> {
  return authenticatedFetch(`/admin/transcripts/review/${sentenceId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
