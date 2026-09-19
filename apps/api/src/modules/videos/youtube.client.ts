import { Injectable } from "@nestjs/common";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export interface YoutubePlaylistItemsPage {
  videoIds: string[];
  nextPageToken?: string;
}

export interface YoutubeVideoMetadata {
  id: string;
  title: string;
  channelTitle: string;
  durationIso: string;
  thumbnailUrl: string;
  privacyStatus: string;
}

interface PlaylistItemsResponse {
  items: Array<{ contentDetails: { videoId: string } }>;
  nextPageToken?: string;
}

interface VideosListResponse {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      channelTitle: string;
      thumbnails: Record<string, { url: string } | undefined>;
    };
    contentDetails: { duration: string };
    status: { privacyStatus: string };
  }>;
}

// Wrapper fino sobre a YouTube Data API v3 — SOMENTE playlistItems.list e
// videos.list (1 unit/chamada cada), nunca search.list (100 units). Isolado
// para permitir mock em teste sem golpear a API real.
@Injectable()
export class YoutubeClient {
  private get apiKey(): string {
    return process.env.YOUTUBE_API_KEY ?? "";
  }

  async listPlaylistItems(playlistId: string, pageToken?: string): Promise<YoutubePlaylistItemsPage> {
    const url = new URL(`${YOUTUBE_API_BASE}/playlistItems`);
    url.searchParams.set("part", "contentDetails");
    url.searchParams.set("playlistId", playlistId);
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("key", this.apiKey);
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`YouTube playlistItems.list falhou (${res.status}) para playlist ${playlistId}`);
    }

    const body = (await res.json()) as PlaylistItemsResponse;

    return {
      videoIds: body.items.map((item) => item.contentDetails.videoId),
      nextPageToken: body.nextPageToken,
    };
  }

  // videoIds deve ter no máximo 50 itens (limite da própria API) — quem
  // decide o loteamento é o chamador (YoutubeSyncService).
  async listVideos(videoIds: string[]): Promise<YoutubeVideoMetadata[]> {
    if (videoIds.length === 0) {
      return [];
    }

    const url = new URL(`${YOUTUBE_API_BASE}/videos`);
    url.searchParams.set("part", "snippet,contentDetails,status");
    url.searchParams.set("id", videoIds.join(","));
    url.searchParams.set("key", this.apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`YouTube videos.list falhou (${res.status})`);
    }

    const body = (await res.json()) as VideosListResponse;

    return body.items.map((item) => ({
      id: item.id,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      durationIso: item.contentDetails.duration,
      thumbnailUrl:
        item.snippet.thumbnails.maxres?.url ??
        item.snippet.thumbnails.high?.url ??
        item.snippet.thumbnails.default?.url ??
        "",
      privacyStatus: item.status.privacyStatus,
    }));
  }
}
