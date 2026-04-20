/**
 * AudioEngine — Phase 3.0 procedural composer surface.
 *
 * Layers: binaural carrier, Schumann-tuned drone, solfeggio overtone,
 * Schumann harmonics (8 peaks), silence-window controller. The
 * Composer (lib/composer.ts) reads biometric snapshots and calls
 * the mutation methods on this class to retune / swell / silence in
 * real time.
 *
 * Audio context resumption MUST happen on a user gesture — call
 * `engine.unlock()` from a click handler before `engine.start()`.
 */

import * as Tone from "tone";
import { BinauralLayer } from "./layers/BinauralLayer";
import { DroneLayer } from "./layers/DroneLayer";
import { HarmonicLayer } from "./layers/HarmonicLayer";
import { SchumannHarmonicsLayer } from "./layers/SchumannHarmonics";
import { SilenceWindowController, type SilenceParams } from "./layers/SilenceWindow";
import type { IntentDefinition } from "@/lib/intent";

export type LayerName = "binaural" | "drone" | "harmonic" | "schumann";

export type ComposerSeed = {
  intent: string;
  binauralCarrierHz: number;
  binauralOffsetHz: number;
  droneHz: number;
  overtoneHz: number;
  schumannFundamentalHz: number;
  startedAt: string;
  randomSeed: number;
};

export type LiveParams = {
  droneHz: number;
  binauralGain: number;
  droneGain: number;
  harmonicGain: number;
  schumannGain: number;
  silence: SilenceParams;
  lastSilenceAt: number | null;
  perLayerOverride: Record<LayerName, number | null>;
};

export type AudioEngineOptions = {
  intent: IntentDefinition;
  schumannFundamentalHz?: number;
};

const DEFAULT_GAINS: Record<LayerName, number> = {
  binaural: 0.18,
  drone: 0.22,
  harmonic: 0.06,
  schumann: 0.08,
};

const DEFAULT_SILENCE: SilenceParams = {
  intervalSec: 180,
  durationSec: 4,
  fadeSec: 1,
};

export class AudioEngine {
  private master: Tone.Gain | null = null;
  private binaural: BinauralLayer | null = null;
  private drone: DroneLayer | null = null;
  private harmonic: HarmonicLayer | null = null;
  private schumann: SchumannHarmonicsLayer | null = null;
  private silence: SilenceWindowController | null = null;
  private state: "idle" | "starting" | "running" | "stopping" = "idle";
  private seed: ComposerSeed | null = null;
  private currentDroneHz = 0;
  private layerOverride: Record<LayerName, number | null> = {
    binaural: null,
    drone: null,
    harmonic: null,
    schumann: null,
  };
  private currentLayerGain: Record<LayerName, number> = { ...DEFAULT_GAINS };

  async unlock(): Promise<void> {
    if (Tone.getContext().state !== "running") {
      await Tone.start();
    }
  }

  start(opts: AudioEngineOptions): ComposerSeed {
    if (this.state !== "idle") {
      throw new Error(`AudioEngine: cannot start in state ${this.state}`);
    }
    this.state = "starting";

    const { intent } = opts;
    const droneHz = opts.schumannFundamentalHz
      ? intent.audio.droneHz * (opts.schumannFundamentalHz / 7.83)
      : intent.audio.droneHz;

    this.seed = {
      intent: intent.id,
      binauralCarrierHz: intent.audio.binauralCarrierHz,
      binauralOffsetHz: intent.audio.binauralOffsetHz,
      droneHz,
      overtoneHz: intent.audio.overtoneHz,
      schumannFundamentalHz: opts.schumannFundamentalHz ?? 7.83,
      startedAt: new Date().toISOString(),
      randomSeed: Math.floor(Math.random() * 2 ** 31),
    };

    const ctx = Tone.getContext();
    const now = ctx.now();

    this.master = new Tone.Gain(0).toDestination();

    this.binaural = new BinauralLayer(
      intent.audio.binauralCarrierHz,
      intent.audio.binauralOffsetHz,
      this.master,
    );
    this.drone = new DroneLayer(droneHz, this.master);
    this.harmonic = new HarmonicLayer(intent.audio.overtoneHz, this.master);
    this.schumann = new SchumannHarmonicsLayer(this.master);

    this.binaural.start(now);
    this.drone.start(now);
    this.harmonic.start(now);
    this.schumann.start(now);

    this.silence = new SilenceWindowController(this.master, DEFAULT_SILENCE);
    this.silence.start();

    this.master.gain.linearRampToValueAtTime(1, now + 8);
    this.currentDroneHz = droneHz;
    this.currentLayerGain = { ...DEFAULT_GAINS };
    this.layerOverride = { binaural: null, drone: null, harmonic: null, schumann: null };
    this.state = "running";

    return this.seed;
  }

  // ---- Mutation API (Phase 3.0) ----

  retuneDrone(hz: number, glideSec = 2): void {
    if (this.state !== "running") return;
    this.drone?.retune(hz, glideSec);
    this.currentDroneHz = hz;
  }

  setLayerGain(layer: LayerName, value: number): void {
    if (this.state !== "running") return;
    const v = clamp01(value);
    this.currentLayerGain[layer] = v;
    this.applyLayerGain(layer);
  }

  /** Force a layer's gain to `value` regardless of composer mutations.
   *  Pass `null` to release the override. */
  overrideLayer(layer: LayerName, value: number | null): void {
    if (this.state !== "running") return;
    this.layerOverride[layer] = value === null ? null : clamp01(value);
    this.applyLayerGain(layer);
  }

  setSchumannKp(kp: number): void {
    if (this.state !== "running") return;
    this.schumann?.setKp(kp);
  }

  setSilenceParams(params: Partial<SilenceParams>): void {
    if (this.state !== "running") return;
    this.silence?.setParams(params);
  }

  private applyLayerGain(layer: LayerName): void {
    const override = this.layerOverride[layer];
    const value = override ?? this.currentLayerGain[layer];
    switch (layer) {
      case "binaural":
        this.binaural?.setGain(value);
        break;
      case "drone":
        this.drone?.setGain(value);
        break;
      case "harmonic":
        this.harmonic?.setGain(value);
        break;
      case "schumann":
        this.schumann?.setGain(value);
        break;
    }
  }

  getLiveParams(): LiveParams {
    return {
      droneHz: this.currentDroneHz,
      binauralGain: this.layerOverride.binaural ?? this.currentLayerGain.binaural,
      droneGain: this.layerOverride.drone ?? this.currentLayerGain.drone,
      harmonicGain: this.layerOverride.harmonic ?? this.currentLayerGain.harmonic,
      schumannGain: this.layerOverride.schumann ?? this.currentLayerGain.schumann,
      silence: this.silence?.getParams() ?? DEFAULT_SILENCE,
      lastSilenceAt: this.silence?.getLastSilenceStart() ?? null,
      perLayerOverride: { ...this.layerOverride },
    };
  }

  // ---- Lifecycle ----

  stop(fadeSec = 6): Promise<void> {
    if (this.state !== "running" && this.state !== "starting") return Promise.resolve();
    this.state = "stopping";
    const ctx = Tone.getContext();
    const now = ctx.now();
    this.silence?.stop();
    this.master?.gain.cancelScheduledValues(now);
    this.master?.gain.linearRampToValueAtTime(0, now + fadeSec);
    this.binaural?.fadeOut(now, fadeSec);
    this.drone?.fadeOut(now, fadeSec);
    this.harmonic?.fadeOut(now, fadeSec);
    this.schumann?.fadeOut(now, fadeSec);
    return new Promise((resolve) => {
      window.setTimeout(() => {
        this.dispose();
        resolve();
      }, (fadeSec + 0.5) * 1000);
    });
  }

  dispose() {
    this.silence?.stop();
    this.binaural?.dispose();
    this.drone?.dispose();
    this.harmonic?.dispose();
    this.schumann?.dispose();
    this.master?.dispose();
    this.binaural = null;
    this.drone = null;
    this.harmonic = null;
    this.schumann = null;
    this.silence = null;
    this.master = null;
    this.state = "idle";
  }

  getSeed(): ComposerSeed | null {
    return this.seed;
  }

  getState(): typeof this.state {
    return this.state;
  }
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export const DEFAULT_LAYER_GAINS = DEFAULT_GAINS;
