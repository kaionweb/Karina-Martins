import type { AiSessionTranscript, JourneyResponse } from "@ipp/shared";
import { authenticatedFetch } from "@/lib/api/catalog";

export function getJourney(profileId: string): Promise<JourneyResponse> {
  return authenticatedFetch(`/parent/profiles/${profileId}/journey`);
}

export function getTranscripts(profileId: string): Promise<AiSessionTranscript[]> {
  return authenticatedFetch(`/parent/profiles/${profileId}/transcripts`);
}
