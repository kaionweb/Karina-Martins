import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PauseOverlay } from "@/components/videos/PauseOverlay";

describe("PauseOverlay (Story 9.3)", () => {
  it("não aparece quando o player não está pausado (AC3)", () => {
    render(<PauseOverlay visible={false} />);
    expect(screen.queryByText("Pausado")).not.toBeInTheDocument();
  });

  it("aparece quando o player está pausado (AC3)", () => {
    render(<PauseOverlay visible />);
    expect(screen.getByText("Pausado")).toBeInTheDocument();
  });
});
