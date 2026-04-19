/**
 * Eye geometry — pure math derived from MediaPipe Face Landmarker
 * landmark indices.
 *
 * Indices follow the standard 478-point face landmarker. The six
 * EAR points per eye match Soukupová & Čech 2016, mapped to
 * MediaPipe's mesh:
 *   Right eye: outer 33, upper-outer 160, upper-inner 158,
 *              inner 133, lower-inner 153, lower-outer 144
 *   Left eye:  outer 263, upper-outer 387, upper-inner 385,
 *              inner 362, lower-inner 380, lower-outer 373
 *
 * Iris landmarks (468-472 right, 473-477 left) are present only when
 * the landmarker is configured with `outputFaceBlendshapes = false,
 * numFaces = 1, refine_landmarks = true` (which we always do).
 */

export type Landmark = { x: number; y: number; z: number };

export const EYE_INDICES = {
  right: { outer: 33, upperOuter: 160, upperInner: 158, inner: 133, lowerInner: 153, lowerOuter: 144 },
  left: { outer: 263, upperOuter: 387, upperInner: 385, inner: 362, lowerInner: 380, lowerOuter: 373 },
};

export const IRIS_INDICES = {
  right: { center: 468, right: 469, top: 470, left: 471, bottom: 472 },
  left: { center: 473, right: 474, top: 475, left: 476, bottom: 477 },
};

/** EAR closes toward 0; an open relaxed eye sits around 0.30 typically. */
export const EAR_BLINK_THRESHOLD = 0.20;

function dist(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function eyeAspectRatio(landmarks: Landmark[], side: "left" | "right"): number {
  const idx = EYE_INDICES[side];
  const p1 = landmarks[idx.outer];
  const p2 = landmarks[idx.upperOuter];
  const p3 = landmarks[idx.upperInner];
  const p4 = landmarks[idx.inner];
  const p5 = landmarks[idx.lowerInner];
  const p6 = landmarks[idx.lowerOuter];
  if (!p1 || !p4) return 0;
  const horiz = dist(p1, p4);
  if (horiz === 0) return 0;
  const vert1 = dist(p2, p6);
  const vert2 = dist(p3, p5);
  return (vert1 + vert2) / (2 * horiz);
}

/**
 * Average EAR across both eyes — most robust scalar for "are the eyes
 * open" given some users blink asynchronously.
 */
export function averageEAR(landmarks: Landmark[]): number {
  return (eyeAspectRatio(landmarks, "left") + eyeAspectRatio(landmarks, "right")) / 2;
}

export function eyesClosed(ear: number, threshold = EAR_BLINK_THRESHOLD): boolean {
  return ear < threshold;
}

/**
 * Gaze direction relative to eye centre. Returns {x, y} in roughly
 * [-1, 1] where x: -1 = looking right, +1 = looking left (from the
 * camera's POV, mirrored from the user's POV); y: -1 = looking up,
 * +1 = looking down.
 *
 * Returns null if iris landmarks are absent.
 */
export function gazeDirection(landmarks: Landmark[], side: "left" | "right"): { x: number; y: number } | null {
  const eyeIdx = EYE_INDICES[side];
  const irisIdx = IRIS_INDICES[side];
  const outer = landmarks[eyeIdx.outer];
  const inner = landmarks[eyeIdx.inner];
  const top = landmarks[eyeIdx.upperInner];
  const bottom = landmarks[eyeIdx.lowerInner];
  const irisCenter = landmarks[irisIdx.center];
  if (!outer || !inner || !irisCenter || !top || !bottom) return null;
  const eyeCx = (outer.x + inner.x) / 2;
  const eyeCy = (top.y + bottom.y) / 2;
  const eyeHalfW = Math.abs(outer.x - inner.x) / 2;
  const eyeHalfH = Math.abs(top.y - bottom.y) / 2;
  if (eyeHalfW < 1e-6 || eyeHalfH < 1e-6) return null;
  return {
    x: (irisCenter.x - eyeCx) / eyeHalfW,
    y: (irisCenter.y - eyeCy) / eyeHalfH,
  };
}

/** Mean of the two eyes' gaze, clamped to [-1, 1]. */
export function averageGaze(landmarks: Landmark[]): { x: number; y: number } | null {
  const r = gazeDirection(landmarks, "right");
  const l = gazeDirection(landmarks, "left");
  if (!r && !l) return null;
  if (!r) return l;
  if (!l) return r;
  return {
    x: clamp((r.x + l.x) / 2, -1, 1),
    y: clamp((r.y + l.y) / 2, -1, 1),
  };
}

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}
