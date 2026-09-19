import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LessonRow } from "@/components/catalog/LessonRow";
import { accentForIndex } from "@/lib/ui/posterGradients";
import type { LessonWithProgress } from "@ipp/shared";

const accent = accentForIndex(0);

function buildLesson(overrides: Partial<LessonWithProgress>): LessonWithProgress {
  return {
    id: "lesson-1",
    title: "Lição 1",
    order: 1,
    contentBody: "",
    trackId: "track-1",
    completed: false,
    ...overrides,
  };
}

describe("LessonRow (Story 2.3)", () => {
  it("mostra o indicador visual quando completed é true (AC3)", () => {
    render(<LessonRow lesson={buildLesson({ completed: true })} isCurrent={false} accent={accent} />);

    expect(screen.getByText("Lição 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Lição concluída")).toBeInTheDocument();
  });

  it("não mostra o indicador visual quando completed é false", () => {
    render(<LessonRow lesson={buildLesson({ id: "lesson-2", title: "Lição 2", order: 2 })} isCurrent={false} accent={accent} />);

    expect(screen.getByText("Lição 2")).toBeInTheDocument();
    expect(screen.queryByLabelText("Lição concluída")).not.toBeInTheDocument();
  });
});
