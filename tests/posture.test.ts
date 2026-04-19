import { describe, expect, it } from "vitest";
import {
  classifyOrientation,
  computeVariance,
} from "@/components/biometrics/PostureSensor";

describe("posture math", () => {
  it("variance of empty / single sample is 0", () => {
    expect(computeVariance([])).toBe(0);
    expect(computeVariance([9.81])).toBe(0);
  });

  it("variance of constant input is 0", () => {
    expect(computeVariance([5, 5, 5, 5, 5])).toBe(0);
  });

  it("variance of ±1 spaced around the mean is ~1", () => {
    expect(computeVariance([0, 2, 0, 2, 0, 2])).toBeCloseTo(1.2, 1);
  });

  it("classifies a near-flat phone face up", () => {
    expect(classifyOrientation(5, 5)).toBe("flat_face_up");
    expect(classifyOrientation(-5, 5)).toBe("flat_face_down");
  });

  it("classifies an upright phone", () => {
    expect(classifyOrientation(85, 5)).toBe("upright");
    expect(classifyOrientation(-85, 5)).toBe("upright");
    expect(classifyOrientation(95, 0)).toBe("upright");
  });

  it("classifies on-chest tilt (~40° back, low gamma)", () => {
    expect(classifyOrientation(40, 0)).toBe("on_chest");
  });

  it("falls back to tilted for everything else", () => {
    expect(classifyOrientation(30, 60)).toBe("tilted");
    expect(classifyOrientation(120, 80)).toBe("tilted");
  });
});
