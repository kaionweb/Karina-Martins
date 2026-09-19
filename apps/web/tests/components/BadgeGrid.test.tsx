import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BadgeGrid } from "@/components/gamification/BadgeGrid";

const sampleBadge = {
  id: "badge-1",
  code: "FIRST_LESSON",
  title: "Primeira Lição",
  description: "Concluiu a primeira lição na plataforma.",
  iconKey: "badges/first-lesson",
  awardedAt: "2026-07-30T00:00:00.000Z",
};

describe("BadgeGrid (Story 3.4)", () => {
  it("renderiza os badges recebidos via props", () => {
    render(<BadgeGrid badges={[sampleBadge]} />);

    expect(screen.getByText("Primeira Lição")).toBeInTheDocument();
    expect(screen.getByText("Concluiu a primeira lição na plataforma.")).toBeInTheDocument();
  });

  it("mostra mensagem de nenhum badge quando a lista está vazia", () => {
    render(<BadgeGrid badges={[]} />);

    expect(screen.getByText("Nenhum badge conquistado ainda.")).toBeInTheDocument();
  });
});
