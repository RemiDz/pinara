import { describe, expect, it } from "vitest";
import { classifyMeditationState } from "@/components/biometrics/meditation-state";
import type { HRVReading } from "@/components/biometrics/HRVCamera";
import type { BreathReading } from "@/components/biometrics/BreathMic";
import type { PostureReading } from "@/components/biometrics/PostureSensor";
import type { EyeReading } from "@/components/biometrics/FaceMesh";

const steadyHrv: HRVReading = {
  bpm: 60,
  rrIntervals: [1000, 1005, 995, 1000, 998, 1002, 1001, 999],
  lastBeatAt: 0,
  signalQuality: 0.9,
  envelopeSample: 0,
};

const slowBreath: BreathReading = {
  bpm: 6,
  lastInhaleAt: 0,
  inhaleExhaleRatio: 1,
  signalQuality: 0.9,
  envelopeSample: 0,
};

const stillPosture: PostureReading = {
  stillness: 0.95,
  orientation: "on_chest",
  accelVariance: 0.05,
  rotationMagnitude: 90,
};

const eyesClosedReading: EyeReading = {
  ear: 0.05,
  eyesClosed: true,
  blinkRate: 5,
  gaze: null,
};

describe("meditation-state classifier", () => {
  it("returns alert/0 for empty input", () => {
    const out = classifyMeditationState({ hrv: null, breath: null, posture: null, eye: null });
    expect(out.state).toBe("alert");
    expect(out.confidence).toBe(0);
  });

  it("returns deep when stillness, breath, HRV, and eye-closure all align", () => {
    const out = classifyMeditationState({
      hrv: steadyHrv,
      breath: slowBreath,
      posture: stillPosture,
      eye: eyesClosedReading,
    });
    expect(out.state).toBe("deep");
    expect(out.confidence).toBeGreaterThan(0.6);
  });

  it("returns absorbed when most criteria align but eyes are open", () => {
    const out = classifyMeditationState({
      hrv: steadyHrv,
      breath: { ...slowBreath, bpm: 9 },
      posture: { ...stillPosture, stillness: 0.88 },
      eye: { ear: 0.3, eyesClosed: false, blinkRate: 12, gaze: null },
    });
    expect(out.state).toBe("absorbed");
  });

  it("returns focused for moderate stillness and normal breath", () => {
    const out = classifyMeditationState({
      hrv: null,
      breath: { ...slowBreath, bpm: 12, signalQuality: 0.6 },
      posture: { ...stillPosture, stillness: 0.75 },
      eye: null,
    });
    expect(out.state).toBe("focused");
  });

  it("falls back to alert when nothing matches", () => {
    const out = classifyMeditationState({
      hrv: null,
      breath: { ...slowBreath, bpm: 18 },
      posture: { ...stillPosture, stillness: 0.4 },
      eye: null,
    });
    expect(out.state).toBe("alert");
  });
});
