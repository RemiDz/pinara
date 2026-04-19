import { describe, expect, it } from "vitest";
import {
  computeRMS,
  updateEnvelope,
} from "@/components/biometrics/BreathMic";

describe("BreathMic math", () => {
  it("computeRMS returns 0 for silence", () => {
    const buf = new Float32Array(2048); // all zeros
    expect(computeRMS(buf)).toBe(0);
  });

  it("computeRMS ≈ 1/√2 for a unit-amplitude sine wave", () => {
    const n = 2048;
    const buf = new Float32Array(n);
    for (let i = 0; i < n; i++) buf[i] = Math.sin((2 * Math.PI * i) / 32);
    expect(computeRMS(buf)).toBeCloseTo(1 / Math.sqrt(2), 2);
  });

  it("updateEnvelope attacks toward a louder target within one attack constant", () => {
    let env = 0;
    const target = 1;
    // Step the envelope forward in 16 ms increments for 80 ms total
    // (= one attack time constant). The single-pole response reaches
    // ~63 % of target.
    for (let t = 0; t < 80; t += 16) env = updateEnvelope(env, target, 16, 80, 250);
    expect(env).toBeGreaterThan(0.5);
    expect(env).toBeLessThan(0.9);
  });

  it("updateEnvelope releases more slowly than it attacks", () => {
    let env = 1;
    // Drop the target to 0 for 80 ms — release constant is 250 ms so
    // we expect env to remain well above 0.
    for (let t = 0; t < 80; t += 16) env = updateEnvelope(env, 0, 16, 80, 250);
    expect(env).toBeGreaterThan(0.5);
  });

  it("updateEnvelope eventually converges on a held target", () => {
    let env = 0;
    for (let t = 0; t < 3000; t += 16) env = updateEnvelope(env, 0.8, 16, 80, 250);
    expect(env).toBeCloseTo(0.8, 2);
  });
});
