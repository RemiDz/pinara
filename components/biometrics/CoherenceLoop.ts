/**
 * CoherenceLoop — fuses the live biometric streams into the two
 * scores the gland and audio composer consume: depth (0–100) and
 * coherence (0–100).
 *
 * Phase 2.0 covers HRV + breath. Phase 2.1 will extend this with
 * voice F0, and Phase 4 with the meditation-state ML classifier
 * (replacing the heuristic depth term).
 *
 * All inputs and outputs are pure values — no side effects, easy to
 * unit-test.
 */

import type { HRVReading } from "./HRVCamera";
import type { BreathReading } from "./BreathMic";

export type CoherenceInput = {
  hrv: HRVReading | null;
  breath: BreathReading | null;
  /** Target breath rate from the active intent, BPM */
  targetBreathBpm: number;
};

export type CoherenceOutput = {
  /** 0–100, how aligned breath rate is to the target + how steady HRV is */
  coherence: number;
  /** 0–100, ML-estimated meditation depth (heuristic in Phase 2) */
  depth: number;
  /** 0–100, mind-wandering indicator (rises with breath jitter) */
  drift: number;
};

const ZERO: CoherenceOutput = { coherence: 0, depth: 0, drift: 0 };

export function computeCoherence(input: CoherenceInput): CoherenceOutput {
  const { hrv, breath, targetBreathBpm } = input;

  if (!hrv && !breath) return ZERO;

  // --- Coherence: how close breath is to its target, weighted by signal quality.
  let coherence = 0;
  if (breath?.bpm != null) {
    const distance = Math.abs(breath.bpm - targetBreathBpm);
    const norm = Math.max(0, 1 - distance / Math.max(2, targetBreathBpm));
    coherence = norm * (0.4 + 0.6 * breath.signalQuality);
  }
  // Boost if HRV is steady (low RMSSD-relative variance).
  if (hrv?.rrIntervals && hrv.rrIntervals.length >= 4) {
    const stability = rrStability(hrv.rrIntervals);
    coherence = clamp01(coherence * 0.7 + stability * 0.3);
  }

  // --- Depth: weighted blend of HRV stability + breath regularity.
  let depth = 0;
  if (hrv?.rrIntervals && hrv.rrIntervals.length >= 4) {
    depth += rrStability(hrv.rrIntervals) * 0.6;
  }
  if (breath?.signalQuality) depth += breath.signalQuality * 0.4;
  depth = clamp01(depth);

  // --- Drift: complement of breath regularity, scaled by breath presence.
  let drift = 0;
  if (breath?.bpm != null) {
    drift = clamp01(1 - breath.signalQuality);
  }

  return {
    coherence: Math.round(clamp01(coherence) * 100),
    depth: Math.round(depth * 100),
    drift: Math.round(drift * 100),
  };
}

function rrStability(rr: number[]): number {
  const m = mean(rr);
  if (m === 0) return 0;
  // Coefficient of variation, inverted: low CV = steady → 1.
  const variance = mean(rr.map((x) => (x - m) ** 2));
  const cv = Math.sqrt(variance) / m;
  return clamp01(1 - cv);
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function clamp01(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}
