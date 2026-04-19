/**
 * AudioEngine — Phase 1 three-layer composer.
 *
 * Layers: binaural carrier, Schumann-tuned drone, solfeggio overtone.
 * All routed through a master gain that handles session fade-in/out.
 *
 * Tone.js drives signal generation; AudioWorklet scaffolding lives in
 * components/audio/worklets/ for Phase 2 to populate.
 *
 * Audio context resumption MUST happen on a user gesture — Binara taught
 * us never to assume auto-play. Call `engine.unlock()` from a click
 * handler before `engine.start()`.
 */

import * as Tone from "tone";
import { BinauralLayer } from "./layers/BinauralLayer";
import { DroneLayer } from "./layers/DroneLayer";
import { HarmonicLayer } from "./layers/HarmonicLayer";
import type { IntentDefinition } from "@/lib/intent";

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

export type AudioEngineOptions = {
  intent: IntentDefinition;
  /** If known, retune drone to live Schumann fundamental. Phase 2+ */
  schumannFundamentalHz?: number;
};

export class AudioEngine {
  private master: Tone.Gain | null = null;
  private binaural: BinauralLayer | null = null;
  private drone: DroneLayer | null = null;
  private harmonic: HarmonicLayer | null = null;
  private state: "idle" | "starting" | "running" | "stopping" = "idle";
  private seed: ComposerSeed | null = null;

  /** Resume AudioContext on user gesture. Idempotent. */
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

    this.binaural.start(now);
    this.drone.start(now);
    this.harmonic.start(now);

    // Master fade-in over 8 seconds — gentle, never jarring.
    this.master.gain.linearRampToValueAtTime(1, now + 8);
    this.state = "running";

    return this.seed;
  }

  stop(fadeSec = 6): Promise<void> {
    if (this.state !== "running" && this.state !== "starting") return Promise.resolve();
    this.state = "stopping";
    const ctx = Tone.getContext();
    const now = ctx.now();
    this.master?.gain.cancelScheduledValues(now);
    this.master?.gain.linearRampToValueAtTime(0, now + fadeSec);
    this.binaural?.fadeOut(now, fadeSec);
    this.drone?.fadeOut(now, fadeSec);
    this.harmonic?.fadeOut(now, fadeSec);

    return new Promise((resolve) => {
      window.setTimeout(() => {
        this.dispose();
        resolve();
      }, (fadeSec + 0.5) * 1000);
    });
  }

  dispose() {
    this.binaural?.dispose();
    this.drone?.dispose();
    this.harmonic?.dispose();
    this.master?.dispose();
    this.binaural = null;
    this.drone = null;
    this.harmonic = null;
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
