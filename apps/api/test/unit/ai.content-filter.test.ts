import { checkContentSafety } from "../../src/modules/ai/ai.content-filter";

describe("checkContentSafety (Story 4.4)", () => {
  it("aprova um texto seguro", () => {
    expect(checkContentSafety("Let's learn the names of colors together!")).toEqual({ approved: true });
  });

  it("reprova conteúdo de violência", () => {
    expect(checkContentSafety("The hunter will kill the animal.")).toEqual({
      approved: false,
      category: "violence",
    });
  });

  it("reprova conteúdo adulto", () => {
    expect(checkContentSafety("Let's talk about sex.")).toEqual({
      approved: false,
      category: "adult-content",
    });
  });

  it("reprova ofensas leves", () => {
    expect(checkContentSafety("You are so stupid.")).toEqual({
      approved: false,
      category: "insult",
    });
  });

  it("reprova frases de ofensa com múltiplas palavras", () => {
    expect(checkContentSafety("Just shut up already.")).toEqual({
      approved: false,
      category: "insult",
    });
  });

  it("reprova informação pessoal identificável (e-mail)", () => {
    expect(checkContentSafety("Contact me at teacher@example.com")).toEqual({
      approved: false,
      category: "personal-info",
    });
  });

  it("reprova informação pessoal identificável (telefone)", () => {
    expect(checkContentSafety("Call me at 555-123-4567")).toEqual({
      approved: false,
      category: "personal-info",
    });
  });

  it("não reprova uma palavra comum que contenha uma substring da blocklist (evita falso-positivo)", () => {
    expect(checkContentSafety("The killer whale is called an orca.")).toEqual({ approved: true });
  });
});
