import type { ProfileSummary } from "@ipp/shared";

let accessToken: string | null = null;

export function getStoredAccessToken(): string | null {
  return accessToken;
}

export function setStoredAccessToken(token: string | null): void {
  accessToken = token;
}

// Resumo do perfil ativo recuperado pelo POST /auth/refresh (que devolve o
// PRÓPRIO perfil do refresh token, não a lista da conta). Usado por useAuthGuard
// para repopular a store de perfil ativo após um reload de página, sem chamar
// GET /profiles — rota que um token CHILD não pode usar (SEC-002, Story 1.4).
// Carregar o perfil inteiro aqui evita a segunda chamada de rede a /profiles
// (Story 10.4). Vive ao lado do access token para manter lib/auth sem
// dependência de Zustand.
let activeProfileHint: ProfileSummary | null = null;

export function getActiveProfileHint(): ProfileSummary | null {
  return activeProfileHint;
}

export function setActiveProfileHint(profile: ProfileSummary | null): void {
  activeProfileHint = profile;
}
