import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithAuth } from "@/lib/auth";
import { setStoredAccessToken } from "@/lib/auth/token-store";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("fetchWithAuth (retry em 401 — token expirado em memória)", () => {
  beforeEach(() => {
    setStoredAccessToken("token-valido");
    vi.restoreAllMocks();
  });

  it("resposta 200 na primeira tentativa: não tenta renovar nem repetir", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    const res = await fetchWithAuth("/videos");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it("401 na primeira tentativa + refresh ok: repete a chamada com o token novo e devolve a 2ª resposta", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse(401, { error: "expired" })) // chamada original
      .mockResolvedValueOnce(jsonResponse(200, { accessToken: "token-novo", profile: null })) // /auth/refresh
      .mockResolvedValueOnce(jsonResponse(200, { items: [] })); // retry

    const res = await fetchWithAuth("/videos");

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const retryHeaders = fetchMock.mock.calls[2][1]?.headers as Record<string, string>;
    expect(retryHeaders.Authorization).toBe("Bearer token-novo");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ items: [] });
  });

  it("401 na primeira tentativa + refresh também falha: devolve a resposta 401 original, sem 3ª chamada", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse(401, { error: "expired" })) // chamada original
      .mockResolvedValueOnce(jsonResponse(401, { error: "refresh inválido" })); // /auth/refresh falha

    const res = await fetchWithAuth("/videos");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(res.status).toBe(401);
  });
});
