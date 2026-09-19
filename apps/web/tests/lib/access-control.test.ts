import { describe, expect, it } from "vitest";
import {
  computeSeriesAccessStatus,
  computeUnlockedSeriesLevels,
  computeVideoAccessStatus,
  isTrialActive,
  trialDaysRemaining,
  type AccessControlItem,
  type SeriesLevel,
  type VideoLevel,
} from "@ipp/shared";

function levelItem(level: "BASICO" | "INTERMEDIARIO" | "AVANCADO", completed: boolean, hasContent = true) {
  return { level, hasContent, completed };
}

function accessItem(overrides: Partial<AccessControlItem<SeriesLevel>> = {}): AccessControlItem<SeriesLevel> {
  return {
    id: "series-1",
    level: "BASICO",
    hasContent: true,
    completed: false,
    freeAfterTrial: false,
    hasStartedProgress: false,
    ...overrides,
  };
}

describe("isTrialActive / trialDaysRemaining", () => {
  it("trial sem trialStartedAt nunca está ativo", () => {
    expect(isTrialActive(null)).toBe(false);
    expect(trialDaysRemaining(null)).toBe(0);
  });

  it("trial iniciado agora está ativo com 7 dias restantes", () => {
    expect(isTrialActive(new Date())).toBe(true);
    expect(trialDaysRemaining(new Date())).toBe(7);
  });

  it("trial iniciado há 8 dias já expirou", () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    expect(isTrialActive(eightDaysAgo)).toBe(false);
    expect(trialDaysRemaining(eightDaysAgo)).toBe(0);
  });
});

describe("computeUnlockedSeriesLevels", () => {
  it("Básico sempre destravado, Intermediário/Avançado bloqueados sem progresso", () => {
    expect(computeUnlockedSeriesLevels([])).toEqual({ BASICO: true, INTERMEDIARIO: false, AVANCADO: false });
  });

  it("Intermediário destrava quando todo Básico com conteúdo está completo", () => {
    const unlocked = computeUnlockedSeriesLevels([levelItem("BASICO", true), levelItem("BASICO", true)]);
    expect(unlocked.INTERMEDIARIO).toBe(true);
    expect(unlocked.AVANCADO).toBe(false);
  });

  it("bypass destrava os 3 níveis mesmo sem progresso", () => {
    expect(computeUnlockedSeriesLevels([levelItem("BASICO", false)], true)).toEqual({
      BASICO: true,
      INTERMEDIARIO: true,
      AVANCADO: true,
    });
  });
});

describe("computeSeriesAccessStatus — prioridade das regras", () => {
  const activeTrialProfile = { trialStartedAt: new Date() };
  const expiredTrialProfile = { trialStartedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) };

  it("bypass libera tudo, mesmo com trial expirado e sem progresso", () => {
    const items = [accessItem({ id: "a" })];
    const { statusById } = computeSeriesAccessStatus(items, expiredTrialProfile, true);
    expect(statusById.a).toBe("unlocked");
  });

  it("trial ativo libera tudo, mesmo item premium sem progresso", () => {
    const items = [accessItem({ id: "a" })];
    const { statusById, trialActive } = computeSeriesAccessStatus(items, activeTrialProfile, false);
    expect(trialActive).toBe(true);
    expect(statusById.a).toBe("unlocked");
  });

  it("freeAfterTrial libera mesmo com trial expirado", () => {
    const items = [accessItem({ id: "a", freeAfterTrial: true })];
    const { statusById } = computeSeriesAccessStatus(items, expiredTrialProfile, false);
    expect(statusById.a).toBe("unlocked");
  });

  it("grandfathering libera item premium já iniciado, mesmo com trial expirado", () => {
    const items = [accessItem({ id: "a", hasStartedProgress: true })];
    const { statusById } = computeSeriesAccessStatus(items, expiredTrialProfile, false);
    expect(statusById.a).toBe("unlocked");
  });

  it("nível anterior incompleto bloqueia como 'locked-progress', não 'locked-premium'", () => {
    const items = [accessItem({ id: "a", level: "INTERMEDIARIO" })];
    const { statusById } = computeSeriesAccessStatus(items, expiredTrialProfile, false);
    expect(statusById.a).toBe("locked-progress");
  });

  it("nível já destravado mas item não-grátis/sem progresso bloqueia como 'locked-premium'", () => {
    const items = [accessItem({ id: "a", level: "BASICO" })];
    const { statusById } = computeSeriesAccessStatus(items, expiredTrialProfile, false);
    expect(statusById.a).toBe("locked-premium");
  });

  it("prioridade: freeAfterTrial vale mesmo quando o nível também estaria bloqueado por progresso", () => {
    const items = [accessItem({ id: "a", level: "AVANCADO", freeAfterTrial: true })];
    const { statusById } = computeSeriesAccessStatus(items, expiredTrialProfile, false);
    expect(statusById.a).toBe("unlocked");
  });
});

describe("computeVideoAccessStatus — motor genérico reaproveitado com VideoLevel (Listening)", () => {
  const expiredTrialProfile = { trialStartedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) };

  function videoItem(overrides: Partial<AccessControlItem<VideoLevel>> = {}): AccessControlItem<VideoLevel> {
    return {
      id: "video-1",
      level: "INICIANTE",
      hasContent: true,
      completed: false,
      freeAfterTrial: false,
      hasStartedProgress: false,
      ...overrides,
    };
  }

  it("usa a cascata INICIANTE → INTERMEDIARIO → AVANCADO, não a de Series", () => {
    const items = [videoItem({ id: "a", level: "INTERMEDIARIO" })];
    const { statusById } = computeVideoAccessStatus(items, expiredTrialProfile, false);
    expect(statusById.a).toBe("locked-progress");
  });

  it("freeAfterTrial e grandfathering funcionam igual ao motor de Series", () => {
    const items = [
      videoItem({ id: "a", freeAfterTrial: true }),
      videoItem({ id: "b", level: "AVANCADO", hasStartedProgress: true }),
    ];
    const { statusById } = computeVideoAccessStatus(items, expiredTrialProfile, false);
    expect(statusById.a).toBe("unlocked");
    expect(statusById.b).toBe("unlocked");
  });
});
