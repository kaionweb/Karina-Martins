import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TranscriptList } from "@/components/parent/TranscriptList";
import type { AiSessionTranscript } from "@ipp/shared";

const sampleSessions: AiSessionTranscript[] = [
  {
    id: "session-1",
    lessonId: "lesson-1",
    lessonTitle: "Colors in the Forest",
    language: "EN",
    promptTokens: 20,
    completionTokens: 8,
    createdAt: "2026-07-31T00:00:00.000Z",
    messages: [
      { id: "msg-1", role: "user", content: "Tell me about colors", flaggedByFilter: false, createdAt: "2026-07-31T00:00:00.000Z" },
      {
        id: "msg-2",
        role: "assistant",
        content: "Colors are fun to learn!",
        flaggedByFilter: false,
        createdAt: "2026-07-31T00:00:01.000Z",
      },
    ],
  },
];

describe("TranscriptList (Story 5.2)", () => {
  it("renderiza as sessões e mensagens recebidas via props", () => {
    render(<TranscriptList sessions={sampleSessions} />);

    expect(screen.getByText(/Colors in the Forest/)).toBeInTheDocument();
    expect(screen.getByText("Tell me about colors")).toBeInTheDocument();
    expect(screen.getByText("Colors are fun to learn!")).toBeInTheDocument();
  });

  it("indica visualmente mensagens filtradas (flaggedByFilter)", () => {
    const flaggedSession: AiSessionTranscript = {
      ...sampleSessions[0],
      messages: [
        sampleSessions[0].messages[0],
        { ...sampleSessions[0].messages[1], flaggedByFilter: true, content: "Vamos falar sobre outra coisa!" },
      ],
    };

    render(<TranscriptList sessions={[flaggedSession]} />);

    expect(screen.getByText(/conteúdo filtrado/)).toBeInTheDocument();
  });

  it("mostra mensagem de nenhuma conversa quando a lista está vazia", () => {
    render(<TranscriptList sessions={[]} />);

    expect(screen.getByText("Nenhuma conversa registrada ainda.")).toBeInTheDocument();
  });
});
