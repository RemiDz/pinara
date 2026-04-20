import { describe, expect, it } from "vitest";
import {
  chooseDroneHarmonic,
  droneSwellGain,
  silenceCadence,
} from "@/lib/composer";
import { getIntent } from "@/lib/intent";

describe("chooseDroneHarmonic", () => {
  const range = { min: 60, max: 150 };

  it("returns F0 unchanged when already in range", () => {
    expect(chooseDroneHarmonic(110, range)).toBeCloseTo(110, 6);
  });

  it("halves a high voice F0 until it lands in range", () => {
    expect(chooseDroneHarmonic(440, range)).toBeCloseTo(110, 6);
    expect(chooseDroneHarmonic(880, range)).toBeCloseTo(110, 6);
  });

  it("doubles a low F0 until it lands in range", () => {
    expect(chooseDroneHarmonic(45, range)).toBeCloseTo(90, 6);
    // 30 → ×2 = 60 (already in range; no further doubling).
    expect(chooseDroneHarmonic(30, range)).toBeCloseTo(60, 6);
    // 20 → ×2 = 40 (still under) → ×2 = 80.
    expect(chooseDroneHarmonic(20, range)).toBeCloseTo(80, 6);
  });

  it("handles edge inputs without throwing", () => {
    expect(chooseDroneHarmonic(0, range)).toBeGreaterThanOrEqual(range.min);
    expect(chooseDroneHarmonic(-10, range)).toBeGreaterThanOrEqual(range.min);
    expect(Number.isFinite(chooseDroneHarmonic(Infinity, range))).toBe(true);
  });
});

describe("silenceCadence", () => {
  const open = getIntent("open");
  const rest = getIntent("rest");

  it("returns a long-disabled cadence when intent is rest", () => {
    const out = silenceCadence(
      { coherence: 50, depth: 50, drift: 0 },
      rest,
    );
    expect(out.intervalSec).toBeGreaterThan(1000);
    expect(out.durationSec).toBe(0);
  });

  it("falls back to a sane default when coherence is null", () => {
    const out = silenceCadence(null, open);
    expect(out.intervalSec).toBeGreaterThanOrEqual(60);
    expect(out.durationSec).toBeGreaterThan(0);
  });

  it("shortens interval and lengthens duration as coherence rises", () => {
    const low = silenceCadence(
      { coherence: 10, depth: 10, drift: 0 },
      open,
    );
    const high = silenceCadence(
      { coherence: 90, depth: 90, drift: 0 },
      open,
    );
    expect(high.intervalSec).toBeLessThan(low.intervalSec);
    expect(high.durationSec).toBeGreaterThanOrEqual(low.durationSec);
  });

  it("never returns a duration > 8 s or < 0", () => {
    for (const c of [0, 25, 50, 75, 100]) {
      for (const d of [0, 25, 50, 75, 100]) {
        const out = silenceCadence({ coherence: c, depth: 50, drift: d }, open);
        expect(out.durationSec).toBeGreaterThanOrEqual(0);
        expect(out.durationSec).toBeLessThanOrEqual(8);
        expect(out.intervalSec).toBeGreaterThanOrEqual(60);
      }
    }
  });
});

describe("droneSwellGain", () => {
  it("returns the baseline gain at envelope=0.5", () => {
    const out = droneSwellGain(0.5, 0.22);
    expect(out.multiplier).toBeCloseTo(1.0, 1);
    expect(out.gain).toBeCloseTo(0.22, 2);
  });

  it("returns 0.85× at silence and 1.15× at full envelope", () => {
    expect(droneSwellGain(0, 1).multiplier).toBeCloseTo(0.85, 2);
    expect(droneSwellGain(1, 1).multiplier).toBeCloseTo(1.15, 2);
  });

  it("never produces a gain outside [0, 1]", () => {
    for (const e of [-1, -0.5, 0, 0.5, 1, 1.5, 2]) {
      const out = droneSwellGain(e, 0.9);
      expect(out.gain).toBeGreaterThanOrEqual(0);
      expect(out.gain).toBeLessThanOrEqual(1);
    }
  });
});
