import { describe, expect, it } from "vitest";
import { ORACLE_FALLBACK_LINES, pickOracleLine } from "@/lib/oracle-fallback";

describe("oracle fallback", () => {
  it("ships at least 16 lines", () => {
    expect(ORACLE_FALLBACK_LINES.length).toBeGreaterThanOrEqual(16);
  });

  it("every line is ≤20 words and has a snake_case symbol", () => {
    for (const line of ORACLE_FALLBACK_LINES) {
      const words = line.text.trim().split(/\s+/).filter(Boolean);
      expect(words.length, line.text).toBeLessThanOrEqual(20);
      expect(line.symbol).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it("pickOracleLine is deterministic given the same seed", () => {
    expect(pickOracleLine(7).text).toBe(pickOracleLine(7).text);
  });

  it("different seeds usually produce different lines", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 20; i++) seen.add(pickOracleLine(i * 13 + 1).text);
    expect(seen.size).toBeGreaterThan(8);
  });
});
