import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PlayerFacade } from "@/components/videos/PlayerFacade";

vi.mock("next/image", () => ({
  default: ({ fill: _fill, ...props }: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

const IFRAME_API_SRC = "https://www.youtube.com/iframe_api";

describe("PlayerFacade (Story 9.3)", () => {
  it("não carrega o script da IFrame API antes do clique do usuário (AC2)", () => {
    render(
      <PlayerFacade videoId="abc123" title="Cores" thumbnailUrl="https://i.ytimg.com/vi/abc123/hqdefault.jpg" />,
    );

    expect(document.querySelector(`script[src="${IFRAME_API_SRC}"]`)).toBeNull();
    expect(screen.getByRole("button", { name: "Assistir Cores" })).toBeInTheDocument();
  });

  it("carrega o script da IFrame API somente após o clique (AC2)", async () => {
    render(
      <PlayerFacade videoId="abc123" title="Cores" thumbnailUrl="https://i.ytimg.com/vi/abc123/hqdefault.jpg" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Assistir Cores" }));

    await waitFor(() => {
      expect(document.querySelector(`script[src="${IFRAME_API_SRC}"]`)).not.toBeNull();
    });
  });
});
