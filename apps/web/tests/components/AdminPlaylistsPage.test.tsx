import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminPlaylistsPage from "@/app/admin/playlists/page";
import type { AdminPlaylist } from "@/lib/api/admin";

const { createPlaylistMock, listPlaylistsMock } = vi.hoisted(() => ({
  createPlaylistMock: vi.fn(),
  listPlaylistsMock: vi.fn(),
}));

vi.mock("@/hooks/useAuthGuard", () => ({
  useAuthGuard: () => ({ ready: true }),
}));

vi.mock("@/lib/api/admin", () => ({
  createPlaylist: createPlaylistMock,
  listPlaylists: listPlaylistsMock,
}));

function makePlaylist(overrides: Partial<AdminPlaylist> = {}): AdminPlaylist {
  return {
    id: "pl-1",
    playlistId: "PLexample",
    channel: "Canal Kids",
    active: true,
    level: "INICIANTE",
    ageRange: "4-6",
    skill: "VOCABULARIO",
    theme: "Cores",
    createdAt: new Date().toISOString(),
    videosCount: 5,
    freeAfterTrial: false,
    ...overrides,
  };
}

describe("AdminPlaylistsPage (Story 10.5)", () => {
  beforeEach(() => {
    createPlaylistMock.mockReset();
    listPlaylistsMock.mockReset();
  });

  it("renderiza a tabela com o resultado de listPlaylists", async () => {
    listPlaylistsMock.mockResolvedValue([makePlaylist({ theme: "Animais", videosCount: 7 })]);

    render(<AdminPlaylistsPage />);

    expect(await screen.findByText("Animais")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("submete o formulário chamando createPlaylist com o shape esperado e mostra confirmação", async () => {
    listPlaylistsMock.mockResolvedValue([]);
    createPlaylistMock.mockResolvedValue({
      playlist: makePlaylist(),
      sync: { playlistId: "PLtest", videosAvailable: 3 },
    });

    render(<AdminPlaylistsPage />);

    fireEvent.change(await screen.findByLabelText(/URL ou ID/), { target: { value: "PLtest" } });
    fireEvent.change(screen.getByLabelText(/Canal/), { target: { value: "Canal X" } });
    fireEvent.change(screen.getByLabelText(/Faixa etária/), { target: { value: "4-6" } });
    fireEvent.change(screen.getByLabelText(/Tema/), { target: { value: "Cores" } });

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar playlist" }));

    await waitFor(() =>
      expect(createPlaylistMock).toHaveBeenCalledWith({
        playlistUrlOrId: "PLtest",
        channel: "Canal X",
        level: "INICIANTE",
        ageRange: "4-6",
        skill: "VOCABULARIO",
        theme: "Cores",
      }),
    );

    expect(await screen.findByText(/3 vídeo\(s\) disponível\(is\)/)).toBeInTheDocument();
  });

  it("mostra 'Acesso restrito' e esconde formulário/tabela quando listPlaylists retorna 403", async () => {
    listPlaylistsMock.mockRejectedValue(Object.assign(new Error("forbidden"), { status: 403 }));

    render(<AdminPlaylistsPage />);

    expect(await screen.findByText("Acesso restrito")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cadastrar playlist" })).not.toBeInTheDocument();
    expect(screen.queryByText("Playlists cadastradas")).not.toBeInTheDocument();
  });

  it("mostra 'Acesso restrito' quando createPlaylist retorna 403", async () => {
    listPlaylistsMock.mockResolvedValue([]);
    createPlaylistMock.mockRejectedValue(Object.assign(new Error("forbidden"), { status: 403 }));

    render(<AdminPlaylistsPage />);

    fireEvent.change(await screen.findByLabelText(/URL ou ID/), { target: { value: "PLtest" } });
    fireEvent.change(screen.getByLabelText(/Canal/), { target: { value: "Canal X" } });
    fireEvent.change(screen.getByLabelText(/Faixa etária/), { target: { value: "4-6" } });
    fireEvent.change(screen.getByLabelText(/Tema/), { target: { value: "Cores" } });

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar playlist" }));

    expect(await screen.findByText("Acesso restrito")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cadastrar playlist" })).not.toBeInTheDocument();
  });
});
