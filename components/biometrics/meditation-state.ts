/**
 * Meditation-state classifier — Phase 2.2 heuristic version.
 *
 * Returns a discrete state class plus a confidence score given the
 * available biometric streams. This is a deliberately simple decision
 * tree; the API matches what a TFJS classifier will eventually return,
 * so Phase 4 can swap in a trained model behind the same interface
 * without touching call sites.
 *
 * The heuristic is conservative — it returns "alert" rather than
 * over-claiming "deep" when streams are missing or unreliable.
 */

import type { HRVReading } from "./HRVCamera";
import type { BreathReading } from "./BreathMic";
import type { PostureReading } from "./PostureSensor";
import type { EyeReading } from "./FaceMesh";

export type MeditationState =
  | "alert"
  | "drowsy"
  | "focused"
  | "absorbed"
  | "deep";

export type MeditationStateOutput = {
  state: MeditationState;
  confidence: number;
};

export type MeditationStateInput = {
  hrv: HRVReading | null;
  breath: BreathReading | null;
  posture: PostureReading | null;
  eye: EyeReading | null;
};

export function classifyMeditationState(input: MeditationStateInput): MeditationStateOutput {
  const { hrv, breath, posture, eye } = input;

  const stillness = posture?.stillness ?? null;
  const breathBpm = breath?.bpm ?? null;
  const hrvStable = hrv && hrv.signalQuality > 0.5;
  const eyesClosed = eye?.eyesClosed === true;
  const blinkRate = eye?.blinkRate ?? null;

  // No streams at all → fall back to alert with zero confidence.
  if (!stillness && !breathBpm && !hrvStable && eye == null) {
    return { state: "alert", confidence: 0 };
  }

  // DEEP: very still + slow breath + steady HRV + eyes closed.
  if (
    stillness != null &&
    stillness > 0.9 &&
    breathBpm != null &&
    breathBpm < 8 &&
    hrvStable &&
    (eyesClosed || eye == null)
  ) {
    return { state: "deep", confidence: confidenceFromCount([stillness > 0.9, breathBpm < 8, hrvStable, eyesClosed]) };
  }

  // ABSORBED: still + coherent breath + reasonable HRV.
  if (
    stillness != null &&
    stillness > 0.85 &&
    breathBpm != null &&
    breathBpm < 10 &&
    hrvStable
  ) {
    return { state: "absorbed", confidence: 0.7 };
  }

  // DROWSY: slow breath + high blink rate + low stillness contribution.
  if (
    breathBpm != null &&
    breathBpm < 8 &&
    blinkRate != null &&
    blinkRate > 25
  ) {
    return { state: "drowsy", confidence: 0.6 };
  }

  // FOCUSED: still + normal-range breath.
  if (
    stillness != null &&
    stillness > 0.7 &&
    breathBpm != null &&
    breathBpm >= 8 &&
    breathBpm <= 16
  ) {
    return { state: "focused", confidence: 0.6 };
  }

  return { state: "alert", confidence: 0.4 };
}

function confidenceFromCount(flags: boolean[]): number {
  const truthy = flags.filter(Boolean).length;
  return Math.min(1, 0.4 + 0.15 * truthy);
}
