import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LessonChat } from "@/components/chat/LessonChat";
import { DailyLimitReachedError } from "@/lib/api/ai";

describe("LessonChat (Story 6.2)", () => {
  it("envia a mensagem digitada e exibe a resposta na ordem correta", async () => {
    const onSend = vi.fn().mockResolvedValue("Hello! Let's talk about colors.");

    render(<LessonChat title="Tutor de inglês" onSend={onSend} />);

    fireEvent.change(screen.getByPlaceholderText("Digite sua mensagem..."), {
      target: { value: "Hi there" },
    });
    fireEvent.click(screen.getByRole("button", { name: /enviar/i }));

    expect(await screen.findByText("Hi there")).toBeInTheDocument();
    expect(onSend).toHaveBeenCalledWith("Hi there");
    expect(await screen.findByText("Hello! Let's talk about colors.")).toBeInTheDocument();

    const messages = screen.getAllByText(/Hi there|Hello! Let's talk about colors\./);
    expect(messages[0]).toHaveTextContent("Hi there");
    expect(messages[1]).toHaveTextContent("Hello! Let's talk about colors.");
  });

  it("exibe mensagem específica quando o limite diário é atingido", async () => {
    const onSend = vi.fn().mockRejectedValue(new DailyLimitReachedError());

    render(<LessonChat title="Tutor de inglês" onSend={onSend} />);

    fireEvent.change(screen.getByPlaceholderText("Digite sua mensagem..."), {
      target: { value: "Hi there" },
    });
    fireEvent.click(screen.getByRole("button", { name: /enviar/i }));

    expect(
      await screen.findByText("Você atingiu o limite diário de mensagens. Volte amanhã!"),
    ).toBeInTheDocument();
  });

  it("exibe mensagem genérica para outros erros", async () => {
    const onSend = vi.fn().mockRejectedValue(new Error("network error"));

    render(<LessonChat title="Tutor de inglês" onSend={onSend} />);

    fireEvent.change(screen.getByPlaceholderText("Digite sua mensagem..."), {
      target: { value: "Hi there" },
    });
    fireEvent.click(screen.getByRole("button", { name: /enviar/i }));

    expect(await screen.findByText("Não foi possível enviar a mensagem. Tente novamente.")).toBeInTheDocument();
  });

  it("não envia mensagem vazia", () => {
    const onSend = vi.fn();

    render(<LessonChat title="Tutor de inglês" onSend={onSend} />);

    fireEvent.click(screen.getByRole("button", { name: /enviar/i }));

    expect(onSend).not.toHaveBeenCalled();
  });
});
