/**
 * YIN pitch detection (de Cheveigné & Kawahara, 2002).
 *
 * This module exposes a pure TypeScript port of the algorithm so
 * vitest can verify pitch recovery against synthetic sine waves.
 * The actual real-time processor in `public/worklets/yin.worklet.js`
 * inlines an equivalent JS implementation — AudioWorklet processors
 * cannot import from the main bundle, so a degree of duplication is
 * unavoidable. Both copies must stay in sync; tests guard the TS one
 * and the worklet has a tiny self-test harness in `/audio-harness`.
 */

const DEFAULT_THRESHOLD = 0.15;

export type YinResult = {
  /** Detected fundamental in Hz, or null if no pitch confidence */
  f0: number | null;
  /** YIN's confidence — lower is better; null when no candidate */
  probability: number | null;
};

export function detectPitchYin(
  buffer: Float32Array | number[],
  sampleRate: number,
  threshold = DEFAULT_THRESHOLD,
): YinResult {
  const N = buffer.length;
  const half = N >> 1;
  if (half < 16) return { f0: null, probability: null };

  const yin = new Float32Array(half);

  // Step 1 — squared-difference function.
  for (let tau = 0; tau < half; tau++) {
    let sum = 0;
    for (let j = 0; j < half; j++) {
      const d = buffer[j] - buffer[j + tau];
      sum += d * d;
    }
    yin[tau] = sum;
  }

  // Step 2 — cumulative mean normalised difference.
  yin[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < half; tau++) {
    runningSum += yin[tau];
    yin[tau] = runningSum > 0 ? (yin[tau] * tau) / runningSum : 1;
  }

  // Step 3 — first dip below threshold; if none, global minimum.
  let tau = -1;
  for (let t = 2; t < half; t++) {
    if (yin[t] < threshold) {
      while (t + 1 < half && yin[t + 1] < yin[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau === -1) {
    let minVal = yin[2];
    let minTau = 2;
    for (let t = 3; t < half; t++) {
      if (yin[t] < minVal) {
        minVal = yin[t];
        minTau = t;
      }
    }
    if (minVal > 0.5) return { f0: null, probability: null };
    tau = minTau;
  }

  // Step 4 — parabolic interpolation around the chosen lag.
  let refined = tau;
  if (tau > 0 && tau < half - 1) {
    const s0 = yin[tau - 1];
    const s1 = yin[tau];
    const s2 = yin[tau + 1];
    const denom = 2 * (2 * s1 - s2 - s0);
    if (denom !== 0) refined = tau + (s2 - s0) / denom;
  }

  if (refined <= 0) return { f0: null, probability: null };
  return { f0: sampleRate / refined, probability: yin[tau] };
}

/** Plausible singing/humming/speech range. */
export const F0_RANGE_HZ = { min: 60, max: 1100 };

export function isPlausibleF0(hz: number | null): boolean {
  if (hz == null) return false;
  return hz >= F0_RANGE_HZ.min && hz <= F0_RANGE_HZ.max;
}

/** Convenience: synthetic sine for tests + harness self-tests. */
export function syntheticSine(freqHz: number, sampleRate: number, lengthSamples: number): Float32Array {
  const out = new Float32Array(lengthSamples);
  for (let i = 0; i < lengthSamples; i++) {
    out[i] = Math.sin((2 * Math.PI * freqHz * i) / sampleRate);
  }
  return out;
}
