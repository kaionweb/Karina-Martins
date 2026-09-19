import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShowCard } from "@/components/catalog/ShowCard";

describe("ShowCard (Story 2.2)", () => {
  it("renderiza o título do show recebido via props (AC2)", () => {
    render(<ShowCard id="show-1" title="Aventuras no Espaço" />);

    expect(screen.getByText("Aventuras no Espaço")).toBeInTheDocument();
  });

  it("renderiza normalmente sem synopsis/thumbnailKey (props opcionais)", () => {
    render(<ShowCard id="show-2" title="Show Sem Sinopse" />);

    expect(screen.getByText("Show Sem Sinopse")).toBeInTheDocument();
  });
});
