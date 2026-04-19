/**
 * Pupil / iris geometry — pure math from MediaPipe iris landmarks.
 *
 * Absolute pupil diameter requires per-device camera-to-face-distance
 * calibration that we can't do from a phone-held-by-the-user setup.
 * What we CAN do is normalised iris-diameter / eye-width: this is
 * camera-distance invariant and useful as a relative dilation signal.
 *
 * Ambient-light correction (per spec §8.6) requires AmbientLightSensor
 * which is not available on iOS Safari. Phase 2.2 ships the relative
 * measurement; ambient correction lands when ALS or a light-estimating
 * heuristic is in place.
 */

import { EYE_INDICES, IRIS_INDICES, type Landmark } from "./eye";

function dist(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function irisDiameter(landmarks: Landmark[], side: "left" | "right"): number {
  const idx = IRIS_INDICES[side];
  const r = landmarks[idx.right];
  const l = landmarks[idx.left];
  if (!r || !l) return 0;
  return dist(r, l);
}

export function eyeWidth(landmarks: Landmark[], side: "left" | "right"): number {
  const idx = EYE_INDICES[side];
  const outer = landmarks[idx.outer];
  const inner = landmarks[idx.inner];
  if (!outer || !inner) return 0;
  return dist(outer, inner);
}

/**
 * Relative iris size, in fractions of eye width. Typical resting
 * range is about 0.42–0.50 for an awake adult; values move 5–15 %
 * as the autonomic state shifts. Returns null if landmarks are
 * incomplete.
 */
export function relativePupil(landmarks: Landmark[], side: "left" | "right"): number | null {
  const w = eyeWidth(landmarks, side);
  if (w === 0) return null;
  const d = irisDiameter(landmarks, side);
  if (d === 0) return null;
  return d / w;
}

/** Mean over both eyes, or whichever is available. */
export function averageRelativePupil(landmarks: Landmark[]): number | null {
  const r = relativePupil(landmarks, "right");
  const l = relativePupil(landmarks, "left");
  if (r == null && l == null) return null;
  if (r == null) return l;
  if (l == null) return r;
  return (r + l) / 2;
}
