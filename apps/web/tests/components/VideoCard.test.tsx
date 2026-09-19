import { describe, expect, it } from "vitest";
import { formatDuration } from "@/components/videos/VideoCard";

describe("formatDuration", () => {
  it("formata segundos em mm:ss com padding", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(9)).toBe("0:09");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(600)).toBe("10:00");
  });
});
