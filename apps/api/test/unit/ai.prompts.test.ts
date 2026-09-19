import { buildEnglishTutorSystemPrompt, buildPortugueseAssistantSystemPrompt } from "../../src/modules/ai/ai.prompts";

describe("buildEnglishTutorSystemPrompt (Story 4.2)", () => {
  it("inclui o título e o conteúdo da lição no prompt (AC1)", () => {
    const prompt = buildEnglishTutorSystemPrompt({
      title: "Colors in the Forest",
      contentBody: "Learn the names of colors with forest animals.",
    });

    expect(prompt).toContain("Colors in the Forest");
    expect(prompt).toContain("Learn the names of colors with forest animals.");
  });

  it("instrui a IA a recusar e redirecionar para o tema quando fora do escopo (AC2)", () => {
    const prompt = buildEnglishTutorSystemPrompt({
      title: "Colors in the Forest",
      contentBody: "Learn the names of colors with forest animals.",
    });

    expect(prompt.toLowerCase()).toContain("politely refuse");
    expect(prompt.toLowerCase()).toContain("redirect");
  });
});

describe("buildPortugueseAssistantSystemPrompt (Story 4.3)", () => {
  it("inclui o título e o conteúdo da lição quando fornecida (AC1)", () => {
    const prompt = buildPortugueseAssistantSystemPrompt({
      title: "Colors in the Forest",
      contentBody: "Learn the names of colors with forest animals.",
    });

    expect(prompt).toContain("Colors in the Forest");
    expect(prompt).toContain("Learn the names of colors with forest animals.");
  });

  it("gera um prompt genérico, sem menção a lição, quando nenhuma lição é fornecida (AC1)", () => {
    const promptNull = buildPortugueseAssistantSystemPrompt(null);
    const promptUndefined = buildPortugueseAssistantSystemPrompt();

    expect(promptNull.toLowerCase()).toContain("responda de forma geral");
    expect(promptUndefined.toLowerCase()).toContain("responda de forma geral");
    expect(promptNull).not.toContain("Colors in the Forest");
  });
});
