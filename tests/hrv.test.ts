import { describe, expect, it } from "vitest";
import {
  HRVCamera,
  movingAverage,
  movingMean,
  median,
  percentile,
  syntheticPPG,
} from "@/components/biometrics/HRVCamera";

describe("HRVCamera math", () => {
  it("movingMean returns 0 for empty input", () => {
    expect(movingMean([], 10)).toBe(0);
  });

  it("movingAverage smooths a step signal", () => {
    const input = [0, 0, 0, 0, 0, 10, 10, 10, 10, 10];
    const smoothed = movingAverage(input, 3);
    expect(smoothed[0]).toBe(0);
    // After the step the output should rise gradually.
    expect(smoothed[5]).toBeGreaterThan(0);
    expect(smoothed[5]).toBeLessThan(10);
    expect(smoothed[9]).toBe(10);
  });

  it("percentile 0.5 equals the median for sorted input", () => {
    expect(percentile([1, 2, 3, 4, 5], 0.5)).toBe(3);
  });

  it("median handles even and odd length inputs", () => {
    expect(median([1, 2, 3])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([])).toBe(0);
  });
});

describe("HRVCamera peak detection", () => {
  it("recovers BPM within ±5 of the ground truth on a clean synthetic signal", () => {
    const bpm = 72;
    const { samples } = syntheticPPG({ bpm, durationSec: 20 });
    const cam = new HRVCamera();
    const startMs = 1_000_000; // deterministic pseudo-clock
    const hz = 30;
    for (let i = 0; i < samples.length; i++) {
      cam.pushSample(samples[i], startMs + (i * 1000) / hz);
    }
    const reading = cam.read();
    expect(reading.bpm).not.toBeNull();
    expect(Math.abs((reading.bpm as number) - bpm)).toBeLessThanOrEqual(5);
  });

  it("recovers BPM on a noisy signal within ±8 BPM", () => {
    const bpm = 66;
    const { samples } = syntheticPPG({
      bpm,
      durationSec: 25,
      noiseAmp: 1.5,
      randomSeed: 42,
    });
    const cam = new HRVCamera();
    const startMs = 1_000_000;
    const hz = 30;
    for (let i = 0; i < samples.length; i++) {
      cam.pushSample(samples[i], startMs + (i * 1000) / hz);
    }
    const reading = cam.read();
    expect(reading.bpm).not.toBeNull();
    expect(Math.abs((reading.bpm as number) - bpm)).toBeLessThanOrEqual(8);
  });

  it("returns null BPM with low signal quality when fed random noise", () => {
    const cam = new HRVCamera();
    const startMs = 1_000_000;
    const hz = 30;
    let seed = 7;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = 0; i < 300; i++) {
      cam.pushSample(120 + 4 * (rand() - 0.5), startMs + (i * 1000) / hz);
    }
    const reading = cam.read();
    // On pure noise the detector should either produce no stable BPM
    // or report very poor signal quality.
    if (reading.bpm !== null) {
      expect(reading.signalQuality).toBeLessThan(0.6);
    }
  });
});
