import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { XpBar } from "@/components/gamification/XpBar";

describe("XpBar (Story 3.2)", () => {
  it("renderiza o valor de currentXp recebido via props", () => {
    render(<XpBar currentXp={120} />);

    expect(screen.getByText("120 XP")).toBeInTheDocument();
  });

  it("renderiza corretamente com XP zero", () => {
    render(<XpBar currentXp={0} />);

    expect(screen.getByText("0 XP")).toBeInTheDocument();
  });
});
