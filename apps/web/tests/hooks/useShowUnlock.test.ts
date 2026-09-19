import { describe, expect, it } from "vitest";
import { isFirstShowComplete } from "@/lib/progression/useShowUnlock";

function lesson(completed: boolean) {
  return { id: "l1", title: "L", order: 1, contentBody: "x", trackId: "t1", completed };
}

describe("isFirstShowComplete", () => {
  it("false quando não há nenhuma lição (trilha sem trecho, defensivo)", () => {
    expect(isFirstShowComplete([])).toBe(false);
    expect(isFirstShowComplete([[]])).toBe(false);
  });

  it("false quando alguma lição de alguma trilha não está concluída", () => {
    const lessonsByTrack = [[lesson(true), lesson(false)]];
    expect(isFirstShowComplete(lessonsByTrack)).toBe(false);
  });

  it("true quando todas as lições de todas as trilhas estão concluídas", () => {
    const lessonsByTrack = [[lesson(true), lesson(true)], [lesson(true)]];
    expect(isFirstShowComplete(lessonsByTrack)).toBe(true);
  });

  it("considera trilhas múltiplas em conjunto (uma trilha completa não basta se outra não está)", () => {
    const lessonsByTrack = [[lesson(true)], [lesson(false)]];
    expect(isFirstShowComplete(lessonsByTrack)).toBe(false);
  });
});
