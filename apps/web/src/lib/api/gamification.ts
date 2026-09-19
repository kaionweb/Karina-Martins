import type { Badge, RankingResponse, XpTotalResponse } from "@ipp/shared";
import { authenticatedFetch } from "@/lib/api/catalog";

export function getXpTotal(): Promise<XpTotalResponse> {
  return authenticatedFetch("/gamification/xp");
}

export function getBadges(): Promise<Badge[]> {
  return authenticatedFetch("/gamification/badges");
}

export function getRanking(): Promise<RankingResponse> {
  return authenticatedFetch("/gamification/ranking");
}
