/**
 * Composer — bridges biometric / cosmic state to live AudioEngine
 * mutations. The engine itself is dumb (it just owns layers); this
 * class decides what the engine should do.
 *
 * Phase 3.0 mutations:
 *   - Voice F0 → drone retunes to nearest octave of F0 in [60, 150] Hz
 *   - Breath envelope → drone gain swell (multiplier on baseline)
 *   - HRV coherence → silence-window cadence
 *   - Schumann Kp → schumann harmonics intensity
 *
 * The pure helper functions (chooseDroneHarmonic, silenceCadence,
 * droneSwellGain) are exported separately so they can be unit-tested
 * without instantiating Tone.js.
 */

import { AudioEngine, DEFAULT_LAYER_GAINS } from "@/components/audio/AudioEngine";
import type { IntentDefinition } from "@/lib/intent";
import type { HRVReading } from "@/components/biometrics/HRVCamera";
import type { BreathReading } from "@/components/biometrics/BreathMic";
import type { VoiceReading } from "@/components/biometrics/VoiceAnalyser";
import type { CoherenceOutput } from "@/components/biometrics/CoherenceLoop";

const DRONE_RANGE = { min: 60, max: 150 };

export type ComposerSnapshot = {
  hrv: HRVReading | null;
  breath: BreathReading | null;
  voice: VoiceReading | null;
  coherence: CoherenceOutput | null;
  schumannKp: number | null;
  schumannAmplitude: number | null;
};

export type ComposerLiveState = {
  /** What the composer THINKS the drone should be at */
  targetDroneHz: number;
  /** Whether voice is currently steering the drone */
  voiceSteering: boolean;
  /** Last voice F0 used for retune, if any */
  lastVoiceF0: number | null;
  /** Current swell multiplier applied to drone gain */
  swellMultiplier: number;
  /** Cadence currently in effect */
  silenceIntervalSec: number;
  silenceDurationSec: number;
};

export class Composer {
  private intent: IntentDefinition;
  private engine: AudioEngine;
  private baseDroneHz: number;
  private baseGains = DEFAULT_LAYER_GAINS;
  private liveState: ComposerLiveState;

  constructor(engine: AudioEngine, intent: IntentDefinition, baseDroneHz: number) {
    this.engine = engine;
    this.intent = intent;
    this.baseDroneHz = baseDroneHz;
    this.liveState = {
      targetDroneHz: baseDroneHz,
      voiceSteering: false,
      lastVoiceF0: null,
      swellMultiplier: 1,
      silenceIntervalSec: 180,
      silenceDurationSec: 4,
    };
  }

  update(snap: ComposerSnapshot): void {
    // ---- Voice → drone harmoniser ----
    if (snap.voice?.voiceActive && snap.voice.f0 != null) {
      const target = chooseDroneHarmonic(snap.voice.f0, DRONE_RANGE);
      if (Math.abs(target - this.liveState.targetDroneHz) > 0.5) {
        this.engine.retuneDrone(target, 1.5);
        this.liveState.targetDroneHz = target;
      }
      this.liveState.voiceSteering = true;
      this.liveState.lastVoiceF0 = snap.voice.f0;
    } else if (this.liveState.voiceSteering) {
      // Voice has stopped — glide drone back to its baseline.
      this.engine.retuneDrone(this.baseDroneHz, 4);
      this.liveState.targetDroneHz = this.baseDroneHz;
      this.liveState.voiceSteering = false;
    }

    // ---- Breath → drone swell ----
    const swell = droneSwellGain(snap.breath?.envelopeSample ?? 0, this.baseGains.drone);
    this.engine.setLayerGain("drone", swell.gain);
    this.liveState.swellMultiplier = swell.multiplier;

    // ---- HRV / coherence → silence cadence ----
    const cadence = silenceCadence(snap.coherence, this.intent);
    this.engine.setSilenceParams(cadence);
    this.liveState.silenceIntervalSec = cadence.intervalSec;
    this.liveState.silenceDurationSec = cadence.durationSec;

    // ---- Schumann Kp → harmonics intensity ----
    if (snap.schumannKp != null) {
      this.engine.setSchumannKp(snap.schumannKp);
    }
  }

  getLiveState(): ComposerLiveState {
    return { ...this.liveState };
  }

  resetForNewIntent(intent: IntentDefinition, baseDroneHz: number): void {
    this.intent = intent;
    this.baseDroneHz = baseDroneHz;
    this.liveState.targetDroneHz = baseDroneHz;
    this.liveState.voiceSteering = false;
  }
}

// ---- Pure helpers (tested) ----

/**
 * Snap a voice F0 to the nearest octave that lands inside the
 * drone's preferred range. Returns the F0 itself if it's already
 * in range; otherwise multiplies/divides by 2 until it fits.
 */
export function chooseDroneHarmonic(
  f0: number,
  range: { min: number; max: number },
): number {
  if (f0 <= 0 || !isFinite(f0)) return (range.min + range.max) / 2;
  let hz = f0;
  let safety = 24;
  while (hz > range.max && safety-- > 0) hz /= 2;
  while (hz < range.min && safety-- > 0) hz *= 2;
  return clamp(hz, range.min, range.max);
}

/**
 * Silence-window cadence as a function of coherence + drift.
 * High coherence → longer windows. High drift → shorter / disabled.
 */
export function silenceCadence(
  coherence: CoherenceOutput | null,
  intent: IntentDefinition,
): { intervalSec: number; durationSec: number; fadeSec: number } {
  // Intent-driven defaults.
  const baseInterval = intent.id === "rest" ? 0 : 180;
  const baseDuration = 4;
  if (!coherence) {
    return { intervalSec: baseInterval || 240, durationSec: baseDuration, fadeSec: 1 };
  }
  if (baseInterval === 0) {
    return { intervalSec: 9999, durationSec: 0, fadeSec: 0 };
  }
  const c = coherence.coherence / 100;
  const d = coherence.drift / 100;
  const intervalSec = Math.round(baseInterval * (1 - 0.4 * c + 0.5 * d));
  const durationSec = Math.round(baseDuration + 3 * c - 2 * d);
  return {
    intervalSec: Math.max(60, intervalSec),
    durationSec: clamp(durationSec, 0, 8),
    fadeSec: 1,
  };
}

/**
 * Modulate the drone gain by the smoothed breath envelope. Returns
 * the absolute gain to apply plus the multiplier (for telemetry).
 */
export function droneSwellGain(
  breathEnvelope: number,
  baseGain: number,
): { gain: number; multiplier: number } {
  const e = clamp(breathEnvelope, 0, 1);
  // ±20 % swell around baseline; quiet input collapses to baseline.
  const multiplier = 0.85 + 0.3 * e;
  return {
    gain: clamp(baseGain * multiplier, 0, 1),
    multiplier,
  };
}

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}
