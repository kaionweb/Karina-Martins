import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { JourneyCard } from "@/components/parent/JourneyCard";
import type { JourneyResponse } from "@ipp/shared";

const sampleJourney: JourneyResponse = {
  profile: {
    id: "profile-1",
    nickname: "Pequena Exploradora",
    type: "CHILD",
    ageRange: "4-6",
    currentStreak: 2,
    longestStreak: 3,
    trialStartedAt: "2026-01-01T00:00:00.000Z",
  },
  xpTotal: 10,
  badges: [
    {
      id: "badge-1",
      code: "FIRST_LESSON",
      title: "Primeira Lição",
      description: "Concluiu a primeira lição na plataforma.",
      iconKey: "badges/first-lesson",
      awardedAt: "2026-07-30T00:00:00.000Z",
    },
  ],
  completedLessons: [{ lessonId: "lesson-1", title: "Lição de teste", completedAt: "2026-07-30T00:00:00.000Z" }],
};

describe("JourneyCard (Story 5.1)", () => {
  it("renderiza os dados da jornada recebidos via props", () => {
    render(<JourneyCard journey={sampleJourney} />);

    expect(screen.getByText("Pequena Exploradora")).toBeInTheDocument();
    expect(screen.getByText("10 XP")).toBeInTheDocument();
    expect(screen.getByText(/Streak atual/)).toBeInTheDocument();
    expect(screen.getByText("Primeira Lição")).toBeInTheDocument();
    expect(screen.getByText("Lição de teste")).toBeInTheDocument();
  });

  it("mostra mensagem de nenhuma lição concluída quando a lista está vazia", () => {
    render(<JourneyCard journey={{ ...sampleJourney, completedLessons: [] }} />);

    expect(screen.getByText("Nenhuma lição concluída ainda.")).toBeInTheDocument();
  });
});
