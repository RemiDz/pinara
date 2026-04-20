/**
 * AudioEngine — Phase 3.1 / 3.2.
 *
 * Adds: spatial routing (HRTF panners per layer when spatial=true),
 * isochronic layer (manual on/off), AnalyserNode tap for FFT viz,
 * AudioListener orientation update API for head tracking, integrated
 * Haptics + MIDIOut emission via Composer.
 */

import * as Tone from "tone";
import { BinauralLayer } from "./layers/BinauralLayer";
import { DroneLayer } from "./layers/DroneLayer";
import { HarmonicLayer } from "./layers/HarmonicLayer";
import { SchumannHarmonicsLayer } from "./layers/SchumannHarmonics";
import { IsochronicLayer } from "./layers/IsochronicLayer";
import { SpatialLayer, DEFAULT_POSITIONS, type Vec3 } from "./layers/SpatialLayer";
import { SilenceWindowController, type SilenceParams } from "./layers/SilenceWindow";
import type { IntentDefinition } from "@/lib/intent";

export type LayerName = "binaural" | "drone" | "harmonic" | "schumann" | "isochronic";

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
  isochronicGain: number;
  silence: SilenceParams;
  lastSilenceAt: number | null;
  perLayerOverride: Record<LayerName, number | null>;
  spatial: boolean;
};

export type AudioEngineOptions = {
  intent: IntentDefinition;
  schumannFundamentalHz?: number;
  spatial?: boolean;
  isochronic?: boolean;
};

const DEFAULT_GAINS: Record<LayerName, number> = {
  binaural: 0.18,
  drone: 0.22,
  harmonic: 0.06,
  schumann: 0.08,
  isochronic: 0,
};

const DEFAULT_SILENCE: SilenceParams = { intervalSec: 180, durationSec: 4, fadeSec: 1 };

export class AudioEngine {
  private master: Tone.Gain | null = null;
  private analyser: Tone.Analyser | null = null;
  private binaural: BinauralLayer | null = null;
  private drone: DroneLayer | null = null;
  private harmonic: HarmonicLayer | null = null;
  private schumann: SchumannHarmonicsLayer | null = null;
  private isochronic: IsochronicLayer | null = null;
  private spatialLayers: Partial<Record<LayerName, SpatialLayer>> = {};
  private silence: SilenceWindowController | null = null;
  private state: "idle" | "starting" | "running" | "stopping" = "idle";
  private seed: ComposerSeed | null = null;
  private currentDroneHz = 0;
  private spatial = false;
  private layerOverride: Record<LayerName, number | null> = {
    binaural: null, drone: null, harmonic: null, schumann: null, isochronic: null,
  };
  private currentLayerGain: Record<LayerName, number> = { ...DEFAULT_GAINS };

  async unlock(): Promise<void> {
    if (Tone.getContext().state !== "running") await Tone.start();
  }

  start(opts: AudioEngineOptions): ComposerSeed {
    if (this.state !== "idle") throw new Error(`AudioEngine: cannot start in state ${this.state}`);
    this.state = "starting";
    this.spatial = !!opts.spatial;

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
    this.analyser = new Tone.Analyser("fft", 256);
    this.master.connect(this.analyser);

    const layerDest = (name: LayerName): Tone.ToneAudioNode => {
      if (!this.spatial || !this.master) return this.master!;
      const pos = DEFAULT_POSITIONS[name] ?? { x: 0, y: 0, z: 0 };
      const sp = new SpatialLayer(pos);
      sp.connect(this.master);
      this.spatialLayers[name] = sp;
      return sp.input;
    };

    this.binaural = new BinauralLayer(intent.audio.binauralCarrierHz, intent.audio.binauralOffsetHz, layerDest("binaural"));
    this.drone = new DroneLayer(droneHz, layerDest("drone"));
    this.harmonic = new HarmonicLayer(intent.audio.overtoneHz, layerDest("harmonic"));
    this.schumann = new SchumannHarmonicsLayer(layerDest("schumann"));

    this.binaural.start(now);
    this.drone.start(now);
    this.harmonic.start(now);
    this.schumann.start(now);

    if (opts.isochronic) {
      this.isochronic = new IsochronicLayer(
        intent.audio.binauralCarrierHz,
        intent.audio.binauralOffsetHz,
        layerDest("isochronic"),
      );
      this.isochronic.start(now);
      this.currentLayerGain.isochronic = 0.12;
    }

    this.silence = new SilenceWindowController(this.master, DEFAULT_SILENCE);
    this.silence.start();

    this.master.gain.linearRampToValueAtTime(1, now + 8);
    this.currentDroneHz = droneHz;
    this.state = "running";

    return this.seed;
  }

  // ---- Mutation API ----

  retuneDrone(hz: number, glideSec = 2): void {
    if (this.state !== "running") return;
    this.drone?.retune(hz, glideSec);
    this.currentDroneHz = hz;
  }

  setLayerGain(layer: LayerName, value: number): void {
    if (this.state !== "running") return;
    this.currentLayerGain[layer] = clamp01(value);
    this.applyLayerGain(layer);
  }

  overrideLayer(layer: LayerName, value: number | null): void {
    if (this.state !== "running") return;
    this.layerOverride[layer] = value === null ? null : clamp01(value);
    this.applyLayerGain(layer);
  }

  setSchumannKp(kp: number): void {
    this.schumann?.setKp(kp);
  }

  setSilenceParams(params: Partial<SilenceParams>): void {
    this.silence?.setParams(params);
  }

  /** Update the AudioListener orientation from device tilt. */
  setListenerOrientation(beta: number, gamma: number, alpha: number): void {
    const listener = Tone.getContext().listener as unknown as {
      forwardX?: { rampTo: (v: number, t: number, when: number) => void };
      forwardY?: { rampTo: (v: number, t: number, when: number) => void };
      forwardZ?: { rampTo: (v: number, t: number, when: number) => void };
      upX?: { rampTo: (v: number, t: number, when: number) => void };
      upY?: { rampTo: (v: number, t: number, when: number) => void };
    };
    if (!listener.forwardX) return; // older Safari
    const t = Tone.now();
    const b = (beta * Math.PI) / 180;
    const g = (gamma * Math.PI) / 180;
    const a = (alpha * Math.PI) / 180;
    const fx = Math.sin(a) * Math.cos(b);
    const fz = -Math.cos(a) * Math.cos(b);
    const fy = Math.sin(b);
    const ux = Math.sin(g);
    const uy = Math.cos(g);
    listener.forwardX.rampTo(fx, 0.05, t);
    listener.forwardY!.rampTo(fy, 0.05, t);
    listener.forwardZ!.rampTo(fz, 0.05, t);
    listener.upX!.rampTo(ux, 0.05, t);
    listener.upY!.rampTo(uy, 0.05, t);
  }

  getAnalyser(): Tone.Analyser | null {
    return this.analyser;
  }

  isSpatial(): boolean {
    return this.spatial;
  }

  setLayerPosition(layer: LayerName, pos: Vec3): void {
    this.spatialLayers[layer]?.setPosition(pos);
  }

  private applyLayerGain(layer: LayerName): void {
    const override = this.layerOverride[layer];
    const value = override ?? this.currentLayerGain[layer];
    switch (layer) {
      case "binaural": this.binaural?.setGain(value); break;
      case "drone": this.drone?.setGain(value); break;
      case "harmonic": this.harmonic?.setGain(value); break;
      case "schumann": this.schumann?.setGain(value); break;
      case "isochronic": this.isochronic?.setGain(value); break;
    }
  }

  getLiveParams(): LiveParams {
    return {
      droneHz: this.currentDroneHz,
      binauralGain: this.layerOverride.binaural ?? this.currentLayerGain.binaural,
      droneGain: this.layerOverride.drone ?? this.currentLayerGain.drone,
      harmonicGain: this.layerOverride.harmonic ?? this.currentLayerGain.harmonic,
      schumannGain: this.layerOverride.schumann ?? this.currentLayerGain.schumann,
      isochronicGain: this.layerOverride.isochronic ?? this.currentLayerGain.isochronic,
      silence: this.silence?.getParams() ?? DEFAULT_SILENCE,
      lastSilenceAt: this.silence?.getLastSilenceStart() ?? null,
      perLayerOverride: { ...this.layerOverride },
      spatial: this.spatial,
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
    this.isochronic?.fadeOut(now, fadeSec);
    return new Promise((resolve) => {
      window.setTimeout(() => { this.dispose(); resolve(); }, (fadeSec + 0.5) * 1000);
    });
  }

  dispose() {
    this.silence?.stop();
    this.binaural?.dispose();
    this.drone?.dispose();
    this.harmonic?.dispose();
    this.schumann?.dispose();
    this.isochronic?.dispose();
    Object.values(this.spatialLayers).forEach((s) => s?.dispose());
    this.analyser?.dispose();
    this.master?.dispose();
    this.binaural = null;
    this.drone = null;
    this.harmonic = null;
    this.schumann = null;
    this.isochronic = null;
    this.spatialLayers = {};
    this.analyser = null;
    this.silence = null;
    this.master = null;
    this.state = "idle";
  }

  getSeed(): ComposerSeed | null { return this.seed; }
  getState(): typeof this.state { return this.state; }
}

function clamp01(x: number): number { return x < 0 ? 0 : x > 1 ? 1 : x; }

export const DEFAULT_LAYER_GAINS = DEFAULT_GAINS;
