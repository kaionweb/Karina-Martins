import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "@/app/login/page";

const { pushMock, loginMock, useSearchParamsMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  loginMock: vi.fn(),
  useSearchParamsMock: vi.fn(() => new URLSearchParams("")),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => useSearchParamsMock(),
}));

vi.mock("@/lib/auth", () => ({
  login: loginMock,
}));

describe("LoginPage (Story 6.1)", () => {
  beforeEach(() => {
    pushMock.mockClear();
    loginMock.mockReset();
    useSearchParamsMock.mockReturnValue(new URLSearchParams(""));
  });

  it("envia email/senha para login() e redireciona para /select-profile em caso de sucesso", async () => {
    loginMock.mockResolvedValueOnce({ accessToken: "token" });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "ana@kaionweb.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "Demo@1234" } });
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => expect(loginMock).toHaveBeenCalledWith("ana@kaionweb.com", "Demo@1234"));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/select-profile"));
  });

  it("exibe mensagem de erro quando login() falha", async () => {
    loginMock.mockRejectedValueOnce(new Error("Credenciais inválidas"));

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "ana@kaionweb.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "senha-errada" } });
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    expect(await screen.findByText("Email ou senha inválidos.")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalledWith("/select-profile");
  });

  it("exibe mensagem de sucesso quando vem de um registro recém-concluído", () => {
    useSearchParamsMock.mockReturnValueOnce(new URLSearchParams("registered=1"));

    render(<LoginPage />);

    expect(screen.getByText("Conta criada! Faça login para continuar.")).toBeInTheDocument();
  });
});
