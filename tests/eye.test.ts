import { describe, expect, it } from "vitest";
import {
  EAR_BLINK_THRESHOLD,
  EYE_INDICES,
  IRIS_INDICES,
  averageEAR,
  averageGaze,
  eyeAspectRatio,
  eyesClosed,
  gazeDirection,
  type Landmark,
} from "@/components/biometrics/eye";
import {
  averageRelativePupil,
  irisDiameter,
  relativePupil,
} from "@/components/biometrics/pupil";

/** Build a 478-element landmark array filled with zero, then patch
 *  in the indices we care about for each test. */
function buildLandmarks(patches: Record<number, [number, number]>): Landmark[] {
  const arr: Landmark[] = new Array(478).fill(0).map(() => ({ x: 0, y: 0, z: 0 }));
  for (const [k, [x, y]] of Object.entries(patches)) {
    arr[Number(k)] = { x, y, z: 0 };
  }
  return arr;
}

describe("EAR (eye aspect ratio)", () => {
  it("an open right eye geometry yields EAR ≈ 0.30", () => {
    // Horizontal width 1.0; vertical separations 0.30.
    const lm = buildLandmarks({
      [EYE_INDICES.right.outer]: [0, 0],
      [EYE_INDICES.right.inner]: [1, 0],
      [EYE_INDICES.right.upperOuter]: [0.3, 0.15],
      [EYE_INDICES.right.upperInner]: [0.7, 0.15],
      [EYE_INDICES.right.lowerInner]: [0.7, -0.15],
      [EYE_INDICES.right.lowerOuter]: [0.3, -0.15],
    });
    expect(eyeAspectRatio(lm, "right")).toBeCloseTo(0.3, 2);
  });

  it("a closed eye yields EAR near 0", () => {
    const lm = buildLandmarks({
      [EYE_INDICES.left.outer]: [0, 0],
      [EYE_INDICES.left.inner]: [1, 0],
      [EYE_INDICES.left.upperOuter]: [0.3, 0.005],
      [EYE_INDICES.left.upperInner]: [0.7, 0.005],
      [EYE_INDICES.left.lowerInner]: [0.7, -0.005],
      [EYE_INDICES.left.lowerOuter]: [0.3, -0.005],
    });
    const ear = eyeAspectRatio(lm, "left");
    expect(ear).toBeLessThan(EAR_BLINK_THRESHOLD);
    expect(eyesClosed(ear)).toBe(true);
  });

  it("averageEAR is the mean of left + right", () => {
    const lm = buildLandmarks({
      [EYE_INDICES.right.outer]: [0, 0],
      [EYE_INDICES.right.inner]: [1, 0],
      [EYE_INDICES.right.upperOuter]: [0.3, 0.15],
      [EYE_INDICES.right.upperInner]: [0.7, 0.15],
      [EYE_INDICES.right.lowerInner]: [0.7, -0.15],
      [EYE_INDICES.right.lowerOuter]: [0.3, -0.15],
      [EYE_INDICES.left.outer]: [2, 0],
      [EYE_INDICES.left.inner]: [3, 0],
      [EYE_INDICES.left.upperOuter]: [2.3, 0.05],
      [EYE_INDICES.left.upperInner]: [2.7, 0.05],
      [EYE_INDICES.left.lowerInner]: [2.7, -0.05],
      [EYE_INDICES.left.lowerOuter]: [2.3, -0.05],
    });
    const r = eyeAspectRatio(lm, "right");
    const l = eyeAspectRatio(lm, "left");
    expect(averageEAR(lm)).toBeCloseTo((r + l) / 2, 6);
  });
});

describe("gazeDirection", () => {
  it("returns 0,0 when iris sits at the eye centre", () => {
    const lm = buildLandmarks({
      [EYE_INDICES.right.outer]: [0, 0],
      [EYE_INDICES.right.inner]: [1, 0],
      [EYE_INDICES.right.upperInner]: [0.5, 0.15],
      [EYE_INDICES.right.lowerInner]: [0.5, -0.15],
      [IRIS_INDICES.right.center]: [0.5, 0],
    });
    const g = gazeDirection(lm, "right");
    expect(g).not.toBeNull();
    expect(Math.abs((g as { x: number }).x)).toBeLessThan(1e-6);
    expect(Math.abs((g as { y: number }).y)).toBeLessThan(1e-6);
  });

  it("returns positive x when iris is shifted toward the inner corner", () => {
    const lm = buildLandmarks({
      [EYE_INDICES.right.outer]: [0, 0],
      [EYE_INDICES.right.inner]: [1, 0],
      [EYE_INDICES.right.upperInner]: [0.5, 0.15],
      [EYE_INDICES.right.lowerInner]: [0.5, -0.15],
      [IRIS_INDICES.right.center]: [0.7, 0],
    });
    const g = gazeDirection(lm, "right");
    expect(g).not.toBeNull();
    expect((g as { x: number }).x).toBeGreaterThan(0);
  });

  it("averageGaze returns the mean of both eyes", () => {
    const lm = buildLandmarks({
      [EYE_INDICES.right.outer]: [0, 0],
      [EYE_INDICES.right.inner]: [1, 0],
      [EYE_INDICES.right.upperInner]: [0.5, 0.15],
      [EYE_INDICES.right.lowerInner]: [0.5, -0.15],
      [IRIS_INDICES.right.center]: [0.7, 0],
      [EYE_INDICES.left.outer]: [2, 0],
      [EYE_INDICES.left.inner]: [3, 0],
      [EYE_INDICES.left.upperInner]: [2.5, 0.15],
      [EYE_INDICES.left.lowerInner]: [2.5, -0.15],
      [IRIS_INDICES.left.center]: [2.6, 0],
    });
    const ag = averageGaze(lm);
    expect(ag).not.toBeNull();
    expect((ag as { x: number }).x).toBeGreaterThan(0);
  });
});

describe("relativePupil", () => {
  it("returns iris-diameter / eye-width as a normalised ratio", () => {
    const lm = buildLandmarks({
      [EYE_INDICES.right.outer]: [0, 0],
      [EYE_INDICES.right.inner]: [1, 0],
      [IRIS_INDICES.right.right]: [0.4, 0],
      [IRIS_INDICES.right.left]: [0.6, 0],
    });
    expect(irisDiameter(lm, "right")).toBeCloseTo(0.2, 6);
    expect(relativePupil(lm, "right")).toBeCloseTo(0.2, 6);
  });

  it("returns null when iris landmarks are absent", () => {
    const lm = buildLandmarks({
      [EYE_INDICES.right.outer]: [0, 0],
      [EYE_INDICES.right.inner]: [1, 0],
    });
    expect(relativePupil(lm, "right")).toBeNull();
  });

  it("averageRelativePupil falls back to whichever eye has data", () => {
    const lm = buildLandmarks({
      [EYE_INDICES.left.outer]: [0, 0],
      [EYE_INDICES.left.inner]: [1, 0],
      [IRIS_INDICES.left.right]: [0.45, 0],
      [IRIS_INDICES.left.left]: [0.55, 0],
    });
    expect(averageRelativePupil(lm)).toBeCloseTo(0.1, 6);
  });
});
