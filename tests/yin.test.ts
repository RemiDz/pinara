import { describe, expect, it } from "vitest";
import {
  F0_RANGE_HZ,
  detectPitchYin,
  isPlausibleF0,
  syntheticSine,
} from "@/components/biometrics/yin";

const SR = 48000;

function centsBetween(a: number, b: number): number {
  return 1200 * Math.log2(a / b);
}

describe("YIN pitch detection", () => {
  it("recovers a 220 Hz sine within ±5 cents", () => {
    const buf = syntheticSine(220, SR, 4096);
    const out = detectPitchYin(buf, SR);
    expect(out.f0).not.toBeNull();
    expect(Math.abs(centsBetween(out.f0 as number, 220))).toBeLessThanOrEqual(5);
  });

  it("recovers a 440 Hz sine within ±5 cents", () => {
    const buf = syntheticSine(440, SR, 4096);
    const out = detectPitchYin(buf, SR);
    expect(out.f0).not.toBeNull();
    expect(Math.abs(centsBetween(out.f0 as number, 440))).toBeLessThanOrEqual(5);
  });

  it("recovers a 880 Hz sine within ±10 cents", () => {
    const buf = syntheticSine(880, SR, 4096);
    const out = detectPitchYin(buf, SR);
    expect(out.f0).not.toBeNull();
    expect(Math.abs(centsBetween(out.f0 as number, 880))).toBeLessThanOrEqual(10);
  });

  it("returns null for silence", () => {
    const buf = new Float32Array(4096);
    const out = detectPitchYin(buf, SR);
    expect(out.f0).toBeNull();
  });

  it("isPlausibleF0 accepts the documented range", () => {
    expect(isPlausibleF0(F0_RANGE_HZ.min)).toBe(true);
    expect(isPlausibleF0(F0_RANGE_HZ.max)).toBe(true);
    expect(isPlausibleF0(F0_RANGE_HZ.min - 1)).toBe(false);
    expect(isPlausibleF0(F0_RANGE_HZ.max + 1)).toBe(false);
    expect(isPlausibleF0(null)).toBe(false);
  });

  it("YIN confidence improves with pure signal vs noisy signal", () => {
    const clean = syntheticSine(330, SR, 4096);
    const noisy = new Float32Array(4096);
    let seed = 1;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = 0; i < 4096; i++) {
      noisy[i] = clean[i] + 0.6 * (rand() - 0.5);
    }
    const cleanOut = detectPitchYin(clean, SR);
    const noisyOut = detectPitchYin(noisy, SR);
    expect(cleanOut.probability).not.toBeNull();
    expect(noisyOut.probability).not.toBeNull();
    expect((cleanOut.probability as number)).toBeLessThan(noisyOut.probability as number);
  });
});
