import type { SeriesEpisodeWithProgress, SeriesSummary, TranscriptSentence } from "@ipp/shared";
import { authenticatedFetch } from "@/lib/api/catalog";

export function listSeries(): Promise<SeriesSummary[]> {
  return authenticatedFetch("/series");
}

export function getSeriesEpisodes(seriesId: string): Promise<SeriesEpisodeWithProgress[]> {
  return authenticatedFetch(`/series/${seriesId}/episodes`);
}

export function toggleEpisodeWatched(episodeId: string): Promise<{ watched: boolean }> {
  return authenticatedFetch(`/series/episodes/${episodeId}/watched`, { method: "POST" });
}

// Transcript do episódio (feature de repetição de frase). Lista vazia = sem
// transcript cadastrado → a tela esconde a feature.
export function getEpisodeTranscript(episodeId: string): Promise<TranscriptSentence[]> {
  return authenticatedFetch(`/series/episodes/${episodeId}/transcript`);
}
