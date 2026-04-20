/**
 * Composer — bridges biometric / cosmic state to live AudioEngine
 * mutations + Haptics + MIDIOut.
 *
 * Pure helpers (chooseDroneHarmonic, silenceCadence, droneSwellGain)
 * are exported for vitest coverage.
 */

import { AudioEngine, DEFAULT_LAYER_GAINS, type LiveParams } from "@/components/audio/AudioEngine";
import { Haptics } from "@/components/audio/Haptics";
import { MIDIOut, type MIDIState } from "@/components/audio/MIDIOut";
import type { IntentDefinition } from "@/lib/intent";
import type { HRVReading } from "@/components/biometrics/HRVCamera";
import type { BreathReading } from "@/components/biometrics/BreathMic";
import type { VoiceReading } from "@/components/biometrics/VoiceAnalyser";
import type { CoherenceOutput } from "@/components/biometrics/CoherenceLoop";
import type { MeditationStateOutput } from "@/components/biometrics/meditation-state";

const DRONE_RANGE = { min: 60, max: 150 };

export type ComposerSnapshot = {
  hrv: HRVReading | null;
  breath: BreathReading | null;
  voice: VoiceReading | null;
  coherence: CoherenceOutput | null;
  meditationState?: MeditationStateOutput | null;
  schumannKp: number | null;
  schumannAmplitude: number | null;
};

export type ComposerLiveState = {
  targetDroneHz: number;
  voiceSteering: boolean;
  lastVoiceF0: number | null;
  swellMultiplier: number;
  silenceIntervalSec: number;
  silenceDurationSec: number;
};

export type ComposerOptions = {
  haptics?: Haptics | null;
  midi?: MIDIOut | null;
};

export class Composer {
  private intent: IntentDefinition;
  private engine: AudioEngine;
  private baseDroneHz: number;
  private baseGains = DEFAULT_LAYER_GAINS;
  private liveState: ComposerLiveState;
  private haptics: Haptics | null;
  private midi: MIDIOut | null;

  constructor(engine: AudioEngine, intent: IntentDefinition, baseDroneHz: number, opts: ComposerOptions = {}) {
    this.engine = engine;
    this.intent = intent;
    this.baseDroneHz = baseDroneHz;
    this.haptics = opts.haptics ?? null;
    this.midi = opts.midi ?? null;
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
    if (snap.voice?.voiceActive && snap.voice.f0 != null) {
      const target = chooseDroneHarmonic(snap.voice.f0, DRONE_RANGE);
      if (Math.abs(target - this.liveState.targetDroneHz) > 0.5) {
        this.engine.retuneDrone(target, 1.5);
        this.liveState.targetDroneHz = target;
      }
      this.liveState.voiceSteering = true;
      this.liveState.lastVoiceF0 = snap.voice.f0;
    } else if (this.liveState.voiceSteering) {
      this.engine.retuneDrone(this.baseDroneHz, 4);
      this.liveState.targetDroneHz = this.baseDroneHz;
      this.liveState.voiceSteering = false;
    }

    const swell = droneSwellGain(snap.breath?.envelopeSample ?? 0, this.baseGains.drone);
    this.engine.setLayerGain("drone", swell.gain);
    this.liveState.swellMultiplier = swell.multiplier;

    const cadence = silenceCadence(snap.coherence, this.intent);
    this.engine.setSilenceParams(cadence);
    this.liveState.silenceIntervalSec = cadence.intervalSec;
    this.liveState.silenceDurationSec = cadence.durationSec;

    if (snap.schumannKp != null) this.engine.setSchumannKp(snap.schumannKp);

    if (this.haptics) {
      const hrvBpm = snap.hrv?.bpm ?? 0;
      this.haptics.setHeartBpm(hrvBpm > 30 && (snap.hrv?.signalQuality ?? 0) > 0.4 ? hrvBpm : 0);
      const breathBpm = snap.breath?.bpm ?? 0;
      this.haptics.setBreathBpm(breathBpm > 0 ? breathBpm : 0);
    }

    if (this.midi) {
      const live: LiveParams = this.engine.getLiveParams();
      const midiState: MIDIState = {
        droneHz: live.droneHz,
        droneGain: live.droneGain,
        binauralGain: live.binauralGain,
        harmonicGain: live.harmonicGain,
        schumannGain: live.schumannGain,
        voiceF0: snap.voice?.f0 ?? null,
        hrvBpm: snap.hrv?.bpm ?? null,
        breathBpm: snap.breath?.bpm ?? null,
        coherence: snap.coherence?.coherence ?? 0,
        depth: snap.coherence?.depth ?? 0,
        meditationState: snap.meditationState?.state,
      };
      this.midi.emit(midiState);
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

// ---- Pure helpers ----

export function chooseDroneHarmonic(f0: number, range: { min: number; max: number }): number {
  if (f0 <= 0 || !isFinite(f0)) return (range.min + range.max) / 2;
  let hz = f0;
  let safety = 24;
  while (hz > range.max && safety-- > 0) hz /= 2;
  while (hz < range.min && safety-- > 0) hz *= 2;
  return clamp(hz, range.min, range.max);
}

export function silenceCadence(
  coherence: CoherenceOutput | null,
  intent: IntentDefinition,
): { intervalSec: number; durationSec: number; fadeSec: number } {
  const baseInterval = intent.id === "rest" ? 0 : 180;
  const baseDuration = 4;
  if (!coherence) return { intervalSec: baseInterval || 240, durationSec: baseDuration, fadeSec: 1 };
  if (baseInterval === 0) return { intervalSec: 9999, durationSec: 0, fadeSec: 0 };
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

export function droneSwellGain(breathEnvelope: number, baseGain: number): { gain: number; multiplier: number } {
  const e = clamp(breathEnvelope, 0, 1);
  const multiplier = 0.85 + 0.3 * e;
  return { gain: clamp(baseGain * multiplier, 0, 1), multiplier };
}

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}
