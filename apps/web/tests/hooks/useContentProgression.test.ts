import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { computeUnlockedLevels, levelProgress, useContentProgression } from "@/lib/progression/useContentProgression";

function item(level: "Básico" | "Intermediário" | "Avançado", completed: boolean, hasContent = true) {
  return { level, hasContent, completed };
}

describe("computeUnlockedLevels", () => {
  it("Básico sempre destravado, mesmo sem nenhum item", () => {
    const unlocked = computeUnlockedLevels([]);
    expect(unlocked).toEqual({ Básico: true, Intermediário: false, Avançado: false });
  });

  it("Intermediário continua bloqueado se nem todas as séries Básico com conteúdo estão concluídas", () => {
    const items = [item("Básico", true), item("Básico", false)];
    const unlocked = computeUnlockedLevels(items);
    expect(unlocked.Intermediário).toBe(false);
    expect(unlocked.Avançado).toBe(false);
  });

  it("Intermediário destrava quando todas as séries Básico com conteúdo estão concluídas", () => {
    const items = [item("Básico", true), item("Básico", true)];
    const unlocked = computeUnlockedLevels(items);
    expect(unlocked.Intermediário).toBe(true);
    expect(unlocked.Avançado).toBe(false);
  });

  it("séries sem conteúdo (hasContent: false) não contam pra travar o nível", () => {
    const items = [item("Básico", true), item("Básico", false, false)];
    const unlocked = computeUnlockedLevels(items);
    expect(unlocked.Intermediário).toBe(true);
  });

  it("Avançado só destrava se Básico E Intermediário estiverem completos, em cadeia", () => {
    const items = [item("Básico", true), item("Intermediário", true)];
    const unlocked = computeUnlockedLevels(items);
    expect(unlocked.Intermediário).toBe(true);
    expect(unlocked.Avançado).toBe(true);
  });

  it("Avançado não destrava se Intermediário estiver completo mas Básico não", () => {
    const items = [item("Básico", false), item("Intermediário", true)];
    const unlocked = computeUnlockedLevels(items);
    expect(unlocked.Intermediário).toBe(false);
    expect(unlocked.Avançado).toBe(false);
  });

  it("nível sem nenhuma série com conteúdo não conta como completo (não destrava o próximo)", () => {
    const unlocked = computeUnlockedLevels([item("Básico", false, false)]);
    expect(unlocked.Intermediário).toBe(false);
  });

  it("isAdmin destrava os 3 níveis mesmo sem progresso nenhum", () => {
    const unlocked = computeUnlockedLevels([item("Básico", false)], true);
    expect(unlocked).toEqual({ Básico: true, Intermediário: true, Avançado: true });
  });
});

describe("levelProgress", () => {
  it("conta completed/total só entre itens com conteúdo do nível pedido", () => {
    const items = [item("Básico", true), item("Básico", false), item("Básico", true, false), item("Intermediário", true)];
    expect(levelProgress(items, "Básico")).toEqual({ completed: 1, total: 2 });
  });
});

describe("useContentProgression", () => {
  it("expõe unlocked e progressByLevel consistentes", () => {
    const items = [item("Básico", true), item("Básico", true)];
    const { result } = renderHook(() => useContentProgression(items));
    expect(result.current.unlocked.Intermediário).toBe(true);
    expect(result.current.progressByLevel.Básico).toEqual({ completed: 2, total: 2 });
  });

  it("isAdmin destrava tudo mas mantém progressByLevel real (só o cadeado some)", () => {
    const items = [item("Básico", false)];
    const { result } = renderHook(() => useContentProgression(items, true));
    expect(result.current.unlocked).toEqual({ Básico: true, Intermediário: true, Avançado: true });
    expect(result.current.progressByLevel.Básico).toEqual({ completed: 0, total: 1 });
  });
});
