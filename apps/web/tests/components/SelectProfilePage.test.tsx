import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SelectProfilePage from "@/app/select-profile/page";

const { pushMock, listProfilesMock, selectProfileMock, setActiveProfileMock, createChildProfileMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  listProfilesMock: vi.fn(),
  selectProfileMock: vi.fn(),
  setActiveProfileMock: vi.fn(),
  createChildProfileMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}));

vi.mock("@/hooks/useAuthGuard", () => ({
  useAuthGuard: () => ({ ready: true }),
}));

vi.mock("@/lib/api/profiles", () => ({
  listProfiles: listProfilesMock,
  createChildProfile: createChildProfileMock,
}));

vi.mock("@/lib/auth", () => ({
  selectProfile: selectProfileMock,
}));

vi.mock("@/stores/useProfileStore", () => ({
  useProfileStore: (selector: (state: { setActiveProfile: typeof setActiveProfileMock }) => unknown) =>
    selector({ setActiveProfile: setActiveProfileMock }),
}));

const profiles = [
  { id: "adult-1", nickname: "Ana", type: "ADULT" as const, ageRange: null, currentStreak: 0, longestStreak: 0 },
  { id: "child-1", nickname: "Theo", type: "CHILD" as const, ageRange: "6-8", currentStreak: 3, longestStreak: 3 },
];

describe("SelectProfilePage (Story 6.1)", () => {
  it("lista os perfis e, ao clicar um, seleciona e redireciona para /home", async () => {
    listProfilesMock.mockResolvedValueOnce(profiles);
    selectProfileMock.mockResolvedValueOnce({ accessToken: "scoped-token" });

    render(<SelectProfilePage />);

    expect(await screen.findByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Theo")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Theo"));

    await waitFor(() => expect(selectProfileMock).toHaveBeenCalledWith("child-1"));
    expect(setActiveProfileMock).toHaveBeenCalledWith(profiles[1]);
    expect(pushMock).toHaveBeenCalledWith("/home");
  });

  it("adiciona um novo perfil pelo formulário inline e exibe na lista (AC3, Story 8.1)", async () => {
    listProfilesMock.mockResolvedValueOnce(profiles);
    const newProfile = { id: "child-2", nickname: "Bia", type: "CHILD" as const, ageRange: "4-6", currentStreak: 0, longestStreak: 0 };
    createChildProfileMock.mockResolvedValueOnce(newProfile);

    render(<SelectProfilePage />);

    expect(await screen.findByText("Ana")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Adicionar perfil"));
    fireEvent.change(screen.getByLabelText("Apelido"), { target: { value: "Bia" } });
    fireEvent.click(screen.getByText("Adicionar"));

    await waitFor(() => expect(createChildProfileMock).toHaveBeenCalledWith("Bia", "2-4"));
    expect(await screen.findByText("Bia")).toBeInTheDocument();
  });
});
