import type { ProfileSummary } from "@ipp/shared";
import { authenticatedFetch } from "@/lib/api/catalog";

export function listProfiles(): Promise<ProfileSummary[]> {
  return authenticatedFetch("/profiles");
}

export function createChildProfile(nickname: string, ageRange?: string | null): Promise<ProfileSummary> {
  return authenticatedFetch("/profiles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname, ageRange }),
  });
}

export function updateProfileAvatar(profileId: string, avatarUrl: string | null): Promise<ProfileSummary> {
  return authenticatedFetch(`/profiles/${profileId}/avatar`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ avatarUrl }),
  });
}
