import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppHomePage from "@/app/(app)/home/page";

const { getXpTotalMock, getBadgesMock, getRankingMock, listShowsMock, getContinueLearningMock } = vi.hoisted(() => ({
  getXpTotalMock: vi.fn(),
  getBadgesMock: vi.fn(),
  getRankingMock: vi.fn(),
  listShowsMock: vi.fn(),
  getContinueLearningMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/api/gamification", () => ({
  getXpTotal: getXpTotalMock,
  getBadges: getBadgesMock,
  getRanking: getRankingMock,
}));

vi.mock("@/lib/api/catalog", () => ({
  listShows: listShowsMock,
  getContinueLearning: getContinueLearningMock,
}));

// Default para os testes que não exercitam o card "Continuar aprendendo":
// sem progresso ⇒ fallback, sem quebrar a Home.
getContinueLearningMock.mockResolvedValue({ hasProgress: false });

vi.mock("@/stores/useProfileStore", () => ({
  useProfileStore: (selector: (state: { activeProfile: { nickname: string; currentStreak: number } }) => unknown) =>
    selector({ activeProfile: { nickname: "Theo", currentStreak: 7 } }),
}));

// XP < 1000 evita depender do separador de milhar do Intl no ambiente de teste.
const badges = [
  { id: "b1", code: "FIRST", title: "Primeira lição", description: "", iconKey: "", awardedAt: "2026-01-01" },
  { id: "b2", code: "STREAK3", title: "3 dias", description: "", iconKey: "", awardedAt: "2026-01-02" },
  { id: "b3", code: "XP100", title: "100 XP", description: "", iconKey: "", awardedAt: "2026-01-03" },
];

const shows = [
  { id: "show-1", title: "Risadas em Inglês", synopsis: "Comédia leve para praticar listening.", thumbnailKey: "riso", createdAt: "2026-01-01" },
  { id: "show-2", title: "Mistérios da Cidade", synopsis: "Suspense com vocabulário do dia a dia.", thumbnailKey: "mist", createdAt: "2026-01-02" },
];

const ranking = { position: 3, totalParticipants: 12 };

describe("AppHomePage (Story 10.1)", () => {
  it("(a) renderiza XP total e contagem de medalhas reais após resolver as promises", async () => {
    getXpTotalMock.mockResolvedValueOnce({ total: 850 });
    getBadgesMock.mockResolvedValueOnce(badges);
    getRankingMock.mockResolvedValueOnce(ranking);
    listShowsMock.mockResolvedValueOnce(shows);

    render(<AppHomePage />);

    // XP aparece no StatCard "XP total" na seção "Sua jornada".
    await waitFor(() => expect(screen.getByText("850")).toBeInTheDocument());
    // Contagem de medalhas = badges.length.
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("(b) renderiza os Shows reais em Trilhas em destaque (título + synopsis)", async () => {
    getXpTotalMock.mockResolvedValueOnce({ total: 850 });
    getBadgesMock.mockResolvedValueOnce(badges);
    getRankingMock.mockResolvedValueOnce(ranking);
    listShowsMock.mockResolvedValueOnce(shows);

    render(<AppHomePage />);

    expect(await screen.findByText("Risadas em Inglês")).toBeInTheDocument();
    expect(screen.getByText("Comédia leve para praticar listening.")).toBeInTheDocument();
    expect(screen.getByText("Mistérios da Cidade")).toBeInTheDocument();
    expect(screen.getByText("Suspense com vocabulário do dia a dia.")).toBeInTheDocument();
  });

  it("(c) erro em listShows não quebra a página — XP/medalhas continuam visíveis", async () => {
    getXpTotalMock.mockResolvedValueOnce({ total: 850 });
    getBadgesMock.mockResolvedValueOnce(badges);
    getRankingMock.mockResolvedValueOnce(ranking);
    listShowsMock.mockRejectedValueOnce(new Error("rede"));

    render(<AppHomePage />);

    // Mensagem de erro da seção de trilhas aparece...
    expect(await screen.findByText("Não foi possível carregar as trilhas.")).toBeInTheDocument();
    // ...mas XP e medalhas seguem renderizados normalmente.
    await waitFor(() => expect(screen.getByText("850")).toBeInTheDocument());
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});

describe("AppHomePage (Story 10.2)", () => {
  it("(d) exibe o nível real derivado do XP (sem rótulo de faixa) e a posição do ranking", async () => {
    // XP 850 → deriveLevel(850) = nível 5 (floor(850/200)+1).
    getXpTotalMock.mockResolvedValueOnce({ total: 850 });
    getBadgesMock.mockResolvedValueOnce(badges);
    getRankingMock.mockResolvedValueOnce({ position: 3, totalParticipants: 12 });
    listShowsMock.mockResolvedValueOnce(shows);

    render(<AppHomePage />);

    // Cabeçalho mostra "NÍVEL 5" — sem sufixo de faixa.
    await waitFor(() => expect(screen.getByText("NÍVEL 5")).toBeInTheDocument());
    // Nenhum rótulo de faixa é inventado.
    expect(screen.queryByText(/Intermediário/)).toBeNull();
    // Ranking real "3º" no StatCard "Ranking".
    expect(screen.getByText("3º")).toBeInTheDocument();
  });

  it("(e) quando o ranking retorna position null (perfil ADULT), exibe '—' sem quebrar", async () => {
    getXpTotalMock.mockResolvedValueOnce({ total: 850 });
    getBadgesMock.mockResolvedValueOnce(badges);
    getRankingMock.mockResolvedValueOnce({ position: null, totalParticipants: 5 });
    listShowsMock.mockResolvedValueOnce(shows);

    render(<AppHomePage />);

    // Nível derivado continua renderizando normalmente.
    await waitFor(() => expect(screen.getByText("NÍVEL 5")).toBeInTheDocument());
    // Fallback do ranking.
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});

describe("AppHomePage (Story 10.3 — Continuar aprendendo)", () => {
  it("(f) hasProgress: true renderiza título da lição, posição na trilha e progresso reais", async () => {
    getXpTotalMock.mockResolvedValueOnce({ total: 850 });
    getBadgesMock.mockResolvedValueOnce(badges);
    getRankingMock.mockResolvedValueOnce(ranking);
    listShowsMock.mockResolvedValueOnce(shows);
    getContinueLearningMock.mockResolvedValueOnce({
      hasProgress: true,
      lessonId: "lesson-1",
      lessonTitle: "Cores em Inglês",
      trackId: "track-1",
      trackTitle: "Primeiros Passos",
      lessonPosition: 3,
      totalLessonsInTrack: 8,
      trackProgressPercent: 25,
    });

    render(<AppHomePage />);

    expect(await screen.findByText("Cores em Inglês")).toBeInTheDocument();
    expect(screen.getByText("Lição 3 de 8")).toBeInTheDocument();
    expect(screen.getByText("Primeiros Passos")).toBeInTheDocument();
    expect(screen.getByText("Continuar · 25%")).toBeInTheDocument();
  });

  it("(g) hasProgress: false renderiza o fallback com link para /explorar", async () => {
    getXpTotalMock.mockResolvedValueOnce({ total: 850 });
    getBadgesMock.mockResolvedValueOnce(badges);
    getRankingMock.mockResolvedValueOnce(ranking);
    listShowsMock.mockResolvedValueOnce(shows);
    getContinueLearningMock.mockResolvedValueOnce({ hasProgress: false });

    render(<AppHomePage />);

    expect(await screen.findByText("Comece sua jornada")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Explorar catálogo/ });
    expect(link).toHaveAttribute("href", "/explorar");
  });
});
