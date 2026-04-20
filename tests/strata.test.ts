import { beforeEach, describe, expect, it } from "vitest";
import {
  STRATA,
  evaluateStrata,
  getStrataState,
  isFeatureUnlocked,
  isStratumUnlocked,
  _resetStrata,
} from "@/lib/strata";

beforeEach(() => {
  window.localStorage.clear();
  _resetStrata();
});

describe("strata", () => {
  it("starts at Surface (1)", () => {
    expect(getStrataState().highestUnlocked).toBe(1);
  });

  it("ships exactly 7 strata in correct order", () => {
    expect(STRATA.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("unlocks Resonance Field at 7 sessions", () => {
    const { state, newlyUnlocked } = evaluateStrata({
      totalSessions: 7,
      totalMinutes: 0,
      firstSessionAt: null,
      lastSessionAt: null,
    });
    expect(state.highestUnlocked).toBe(2);
    expect(newlyUnlocked).toContain(2);
  });

  it("unlocks Resonance Field at 90 minutes even with fewer sessions", () => {
    const { state } = evaluateStrata({
      totalSessions: 3,
      totalMinutes: 100,
      firstSessionAt: null,
      lastSessionAt: null,
    });
    expect(state.highestUnlocked).toBe(2);
  });

  it("unlocks all the way to The Flame at 108+ sessions", () => {
    const { state } = evaluateStrata({
      totalSessions: 200,
      totalMinutes: 5000,
      firstSessionAt: null,
      lastSessionAt: null,
    });
    expect(state.highestUnlocked).toBe(7);
  });

  it("isStratumUnlocked respects the chain", () => {
    evaluateStrata({ totalSessions: 21, totalMinutes: 400, firstSessionAt: null, lastSessionAt: null });
    expect(isStratumUnlocked(1)).toBe(true);
    expect(isStratumUnlocked(2)).toBe(true);
    expect(isStratumUnlocked(3)).toBe(true);
    expect(isStratumUnlocked(4)).toBe(false);
  });

  it("isFeatureUnlocked maps to the owning stratum", () => {
    evaluateStrata({ totalSessions: 7, totalMinutes: 90, firstSessionAt: null, lastSessionAt: null });
    expect(isFeatureUnlocked("bhramari")).toBe(true);
    expect(isFeatureUnlocked("oracle_messages")).toBe(false);
  });
});
