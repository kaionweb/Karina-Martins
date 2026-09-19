import { getStoredAccessToken, setStoredAccessToken, setActiveProfileHint } from "./token-store";

export { getActiveProfileHint, setActiveProfileHint } from "./token-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function parseJsonOrThrow(res: Response) {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error?.message ?? "Erro na requisição de autenticação");
  }
  return data;
}

export async function register(email: string, password: string, name?: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  return parseJsonOrThrow(res);
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJsonOrThrow(res);
  setStoredAccessToken(data.accessToken);
  return data;
}

export async function logout(): Promise<void> {
  await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
  setStoredAccessToken(null);
}

export async function refreshAccessToken(): Promise<string | null> {
  const res = await fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" });
  if (!res.ok) {
    setStoredAccessToken(null);
    setActiveProfileHint(null);
    return null;
  }
  const data = await parseJsonOrThrow(res);
  setStoredAccessToken(data.accessToken);
  setActiveProfileHint(data.profile ?? null);
  return data.accessToken;
}

export async function getAccessToken(): Promise<string | null> {
  const current = getStoredAccessToken();
  if (current) return current;
  return refreshAccessToken();
}

// Fetch autenticado com 1 retry automático em 401: o access token (15 min de
// vida) fica só em memória e nunca é revalidado proativamente — em uma sessão
// SPA longa (sem F5), ele expira enquanto o cookie de refresh (TTL maior)
// continua válido. Sem isso, toda chamada autenticada passava a falhar
// silenciosamente depois de ~15 min. Devolve a Response crua (não faz parse
// de JSON) para cada chamador decidir como tratar corpo/erros.
export async function fetchWithAuth(path: string, options: RequestInit = {}): Promise<Response> {
  const accessToken = await getAccessToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...options.headers, ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
  });

  if (res.status !== 401) {
    return res;
  }

  const refreshedToken = await refreshAccessToken();
  if (!refreshedToken) {
    return res;
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${refreshedToken}` },
  });
}

export async function selectProfile(profileId: string) {
  const res = await fetchWithAuth(`/profiles/${profileId}/select`, {
    method: "POST",
    credentials: "include",
  });
  const data = await parseJsonOrThrow(res);
  setStoredAccessToken(data.accessToken);
  return data;
}
