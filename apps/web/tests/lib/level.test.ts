import { describe, expect, it } from "vitest";
import { LEVEL_XP_STEP, deriveLevel } from "@ipp/shared";

describe("deriveLevel (Story 10.2)", () => {
  it("expõe o passo de XP por nível", () => {
    expect(LEVEL_XP_STEP).toBe(200);
  });

  it("XP 0 → nível 1, progresso 0%", () => {
    expect(deriveLevel(0)).toEqual({ level: 1, progressPercent: 0 });
  });

  it("XP 199 → ainda nível 1, progresso ~99.5%", () => {
    const info = deriveLevel(199);
    expect(info.level).toBe(1);
    expect(info.progressPercent).toBeCloseTo(99.5, 5);
  });

  it("XP 200 → sobe para nível 2, progresso reinicia em 0%", () => {
    expect(deriveLevel(200)).toEqual({ level: 2, progressPercent: 0 });
  });

  it("XP 2450 (valor do antigo mock) → nível 13, progresso 25%", () => {
    expect(deriveLevel(2450)).toEqual({ level: 13, progressPercent: 25 });
  });

  it("entrada negativa não quebra: trata como 0 (nível 1)", () => {
    expect(deriveLevel(-50)).toEqual({ level: 1, progressPercent: 0 });
  });

  it("entrada fracionária é truncada antes da fórmula", () => {
    // 250.9 → 250 → nível 2, progresso (50/200)*100 = 25%
    expect(deriveLevel(250.9)).toEqual({ level: 2, progressPercent: 25 });
  });
});
