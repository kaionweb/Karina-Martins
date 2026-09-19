import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterPage from "@/app/register/page";

const { pushMock, registerMock, loginMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  registerMock: vi.fn(),
  loginMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/auth", () => ({
  register: registerMock,
  login: loginMock,
}));

describe("RegisterPage (Story 6.1)", () => {
  beforeEach(() => {
    pushMock.mockClear();
    registerMock.mockReset();
    loginMock.mockReset();
  });

  it("envia email/senha para register(), loga automaticamente e redireciona para /select-profile em caso de sucesso", async () => {
    registerMock.mockResolvedValueOnce({ id: "user-1", email: "ana@kaionweb.com" });
    loginMock.mockResolvedValueOnce({ accessToken: "token" });

    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Seu nome"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "ana@kaionweb.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "Demo@1234" } });
    fireEvent.change(screen.getByLabelText("Confirmar senha"), { target: { value: "Demo@1234" } });
    fireEvent.click(screen.getByLabelText(/li e aceito os/i));
    fireEvent.click(screen.getByRole("button", { name: /criar conta/i }));

    await waitFor(() => expect(registerMock).toHaveBeenCalledWith("ana@kaionweb.com", "Demo@1234", "Ana"));
    await waitFor(() => expect(loginMock).toHaveBeenCalledWith("ana@kaionweb.com", "Demo@1234"));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/select-profile"));
  });

  it("exibe mensagem de erro quando register() falha", async () => {
    registerMock.mockRejectedValueOnce(new Error("Este email já está cadastrado"));

    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Seu nome"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "ana@kaionweb.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "Demo@1234" } });
    fireEvent.change(screen.getByLabelText("Confirmar senha"), { target: { value: "Demo@1234" } });
    fireEvent.click(screen.getByLabelText(/li e aceito os/i));
    fireEvent.click(screen.getByRole("button", { name: /criar conta/i }));

    expect(await screen.findByText("Este email já está cadastrado")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
