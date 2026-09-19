import type { VideoListQuery, VideoListResponse } from "@ipp/shared";
import { authenticatedFetch } from "@/lib/api/catalog";

// Usado por /listening (filtra skill=LISTENING). A galeria /videos e o player
// /videos/[id] foram removidos — o botão "Games" tomou o lugar deles na
// barra inferior.
export function listVideos(query: Partial<VideoListQuery> = {}): Promise<VideoListResponse> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return authenticatedFetch(`/videos${qs ? `?${qs}` : ""}`);
}
