import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAuthGuard } from "@/hooks/useAuthGuard";

const {
  pushMock,
  replaceMock,
  getAccessTokenMock,
  getActiveProfileHintMock,
  setActiveProfileHintMock,
  activeProfileMock,
  setActiveProfileMock,
} = vi.hoisted(() => ({
  pushMock: vi.fn(),
  replaceMock: vi.fn(),
  getAccessTokenMock: vi.fn(),
  getActiveProfileHintMock: vi.fn(),
  setActiveProfileHintMock: vi.fn(),
  activeProfileMock: vi.fn(),
  setActiveProfileMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
}));

vi.mock("@/lib/auth", () => ({
  getAccessToken: getAccessTokenMock,
  getActiveProfileHint: getActiveProfileHintMock,
  setActiveProfileHint: setActiveProfileHintMock,
}));

vi.mock("@/stores/useProfileStore", () => ({
  useProfileStore: (
    selector: (state: {
      activeProfile: unknown;
      setActiveProfile: typeof setActiveProfileMock;
    }) => unknown,
  ) => selector({ activeProfile: activeProfileMock(), setActiveProfile: setActiveProfileMock }),
}));

describe("useAuthGuard (Story 6.1 + 10.4)", () => {
  beforeEach(() => {
    pushMock.mockClear();
    replaceMock.mockClear();
    getAccessTokenMock.mockReset();
    getActiveProfileHintMock.mockReset();
    setActiveProfileHintMock.mockReset();
    activeProfileMock.mockReset();
    setActiveProfileMock.mockReset();
    // Default: sem hint de perfil ativo (comportamento pré-Story 10.4).
    getActiveProfileHintMock.mockReturnValue(null);
  });

  it("redireciona para /login quando não há token", async () => {
    getAccessTokenMock.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAuthGuard());

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/login"));
    expect(result.current.ready).toBe(false);
  });

  it("redireciona para /select-profile quando há token mas requireProfile é exigido sem perfil ativo", async () => {
    getAccessTokenMock.mockResolvedValueOnce("token");
    activeProfileMock.mockReturnValue(null);

    const { result } = renderHook(() => useAuthGuard({ requireProfile: true }));

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/select-profile"));
    expect(result.current.ready).toBe(false);
  });

  it("fica pronto (ready=true) quando há token e perfil ativo exigido está presente", async () => {
    getAccessTokenMock.mockResolvedValueOnce("token");
    activeProfileMock.mockReturnValue({ id: "child-1", nickname: "Theo" });

    const { result } = renderHook(() => useAuthGuard({ requireProfile: true }));

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("fica pronto (ready=true) quando há token e a página não exige perfil ativo", async () => {
    getAccessTokenMock.mockResolvedValueOnce("token");
    activeProfileMock.mockReturnValue(null);

    const { result } = renderHook(() => useAuthGuard());

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(replaceMock).not.toHaveBeenCalled();
  });

  // --- Story 10.4: hint do perfil ativo repopula a store após reload ---
  // /auth/refresh devolve o PRÓPRIO perfil ativo, então o hook repopula a store
  // direto com ele — sem nenhuma chamada a GET /profiles (rota que um token
  // CHILD não pode usar, SEC-002/Story 1.4).

  it("(10.4a) repopula a store direto com o perfil do hint e fica ready sem redirecionar", async () => {
    const hintProfile = { id: "child-1", nickname: "Theo", type: "CHILD" as const };
    getAccessTokenMock.mockResolvedValueOnce("token");
    activeProfileMock.mockReturnValue(null);
    getActiveProfileHintMock.mockReturnValue(hintProfile);

    const { result } = renderHook(() => useAuthGuard({ requireProfile: true }));

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(setActiveProfileMock).toHaveBeenCalledWith(hintProfile);
    expect(setActiveProfileHintMock).toHaveBeenCalledWith(null);
    expect(replaceMock).not.toHaveBeenCalledWith("/select-profile");
  });

  it("(10.4b) sem hint, preserva o redirect atual para /select-profile", async () => {
    getAccessTokenMock.mockResolvedValueOnce("token");
    activeProfileMock.mockReturnValue(null);
    getActiveProfileHintMock.mockReturnValue(null);

    const { result } = renderHook(() => useAuthGuard({ requireProfile: true }));

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/select-profile"));
    expect(result.current.ready).toBe(false);
    expect(setActiveProfileMock).not.toHaveBeenCalled();
  });
});
