import { describe, expect, it } from "vitest";
import { computeCoherence } from "@/components/biometrics/CoherenceLoop";
import type { HRVReading } from "@/components/biometrics/HRVCamera";
import type { BreathReading } from "@/components/biometrics/BreathMic";

const steadyHrv: HRVReading = {
  bpm: 60,
  rrIntervals: [1000, 1005, 995, 1000, 998, 1002, 1001, 999],
  lastBeatAt: 0,
  signalQuality: 0.9,
  envelopeSample: 0,
};

const jitteryHrv: HRVReading = {
  bpm: 60,
  rrIntervals: [600, 1400, 700, 1500, 650, 1450, 800],
  lastBeatAt: 0,
  signalQuality: 0.2,
  envelopeSample: 0,
};

const onTargetBreath: BreathReading = {
  bpm: 6,
  lastInhaleAt: 0,
  inhaleExhaleRatio: 1,
  signalQuality: 0.9,
  envelopeSample: 0,
};

const offTargetBreath: BreathReading = {
  bpm: 18,
  lastInhaleAt: 0,
  inhaleExhaleRatio: 1,
  signalQuality: 0.9,
  envelopeSample: 0,
};

describe("CoherenceLoop", () => {
  it("returns zeros when both streams are absent", () => {
    expect(
      computeCoherence({ hrv: null, breath: null, targetBreathBpm: 6 }),
    ).toEqual({ coherence: 0, depth: 0, drift: 0 });
  });

  it("produces a high coherence score when breath is on target and HRV is steady", () => {
    const out = computeCoherence({
      hrv: steadyHrv,
      breath: onTargetBreath,
      targetBreathBpm: 6,
    });
    expect(out.coherence).toBeGreaterThan(70);
    expect(out.depth).toBeGreaterThan(60);
  });

  it("produces a low coherence score when breath is far from target", () => {
    const out = computeCoherence({
      hrv: steadyHrv,
      breath: offTargetBreath,
      targetBreathBpm: 6,
    });
    expect(out.coherence).toBeLessThan(40);
  });

  it("depth drops when HRV becomes jittery", () => {
    const steady = computeCoherence({
      hrv: steadyHrv,
      breath: onTargetBreath,
      targetBreathBpm: 6,
    });
    const jittery = computeCoherence({
      hrv: jitteryHrv,
      breath: onTargetBreath,
      targetBreathBpm: 6,
    });
    expect(jittery.depth).toBeLessThan(steady.depth);
  });

  it("clamps outputs to the 0–100 range", () => {
    const out = computeCoherence({
      hrv: steadyHrv,
      breath: onTargetBreath,
      targetBreathBpm: 6,
    });
    for (const v of [out.coherence, out.depth, out.drift]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});
