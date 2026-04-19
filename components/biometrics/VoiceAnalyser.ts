/**
 * VoiceAnalyser — Stream 3 of seven (Phase 2.1).
 *
 * Loads the YIN AudioWorklet and surfaces fundamental-frequency
 * readings to the BiometricContext. RMS-gated so silent input emits
 * `voiceActive=false` rather than tracking room noise.
 */

import { F0_RANGE_HZ, isPlausibleF0 } from "./yin";

export type VoiceReading = {
  /** Median of recent F0s in Hz, or null when no plausible voice */
  f0: number | null;
  voiceActive: boolean;
  /** Unix ms */
  lastVoiceAt: number | null;
  /** 0..1, derived from YIN probability + RMS stability */
  signalQuality: number;
  /** Latest RMS for visualisation */
  envelopeSample: number;
};

const RMS_THRESHOLD = 0.005;
const F0_HISTORY = 5;
const PROBABILITY_WINDOW = 10;
const WORKLET_URL = "/worklets/yin.worklet.js";

type Listener = (reading: VoiceReading) => void;
type WorkletMessage = {
  f0: number | null;
  probability: number | null;
  rms: number;
  t: number;
};

let workletLoaded = false;

export class VoiceAnalyser {
  private ctxOwn = false;
  private audioCtx: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private node: AudioWorkletNode | null = null;
  private stream: MediaStream | null = null;

  private f0History: number[] = [];
  private probabilityHistory: number[] = [];
  private lastVoiceAt: number | null = null;
  private latestRms = 0;

  private listeners = new Set<Listener>();

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  async start(stream: MediaStream, sharedCtx?: AudioContext): Promise<void> {
    this.stop();
    this.stream = stream;

    if (sharedCtx) {
      this.audioCtx = sharedCtx;
    } else {
      this.audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext!)();
      this.ctxOwn = true;
    }
    if (this.audioCtx.state === "suspended") await this.audioCtx.resume();

    if (!workletLoaded) {
      await this.audioCtx.audioWorklet.addModule(WORKLET_URL);
      workletLoaded = true;
    }

    this.source = this.audioCtx.createMediaStreamSource(stream);
    this.node = new AudioWorkletNode(this.audioCtx, "yin");
    this.node.port.onmessage = (ev: MessageEvent<WorkletMessage>) => this.onMessage(ev.data);
    this.source.connect(this.node);
    // Note: no connection to destination — we don't want to play the
    // user's voice back; the worklet only analyses.
  }

  stop(): void {
    if (this.node) {
      this.node.port.onmessage = null;
      this.node.disconnect();
      this.node = null;
    }
    this.source?.disconnect();
    this.source = null;
    if (this.stream) {
      // Don't stop tracks here — the stream is shared with BreathMic
      // and owned by the caller (BiometricContext).
      this.stream = null;
    }
    if (this.ctxOwn && this.audioCtx) {
      void this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
      this.ctxOwn = false;
    }
    this.f0History = [];
    this.probabilityHistory = [];
    this.lastVoiceAt = null;
    this.latestRms = 0;
  }

  private onMessage(msg: WorkletMessage): void {
    this.latestRms = msg.rms;
    const above = msg.rms >= RMS_THRESHOLD;
    if (above && isPlausibleF0(msg.f0)) {
      this.f0History.push(msg.f0 as number);
      if (this.f0History.length > F0_HISTORY) this.f0History.shift();
      if (msg.probability != null) {
        this.probabilityHistory.push(msg.probability);
        if (this.probabilityHistory.length > PROBABILITY_WINDOW) this.probabilityHistory.shift();
      }
      this.lastVoiceAt = Date.now();
    } else if (!above) {
      // Decay history quickly when silence arrives so the displayed
      // F0 doesn't lag voice cessation.
      this.f0History = [];
    }
    this.emit();
  }

  private emit(): void {
    const reading = this.read();
    this.listeners.forEach((fn) => fn(reading));
  }

  read(): VoiceReading {
    const voiceActive =
      this.latestRms >= RMS_THRESHOLD && this.f0History.length >= 2;
    const f0 = voiceActive ? median(this.f0History) : null;
    const meanProb =
      this.probabilityHistory.length > 0
        ? this.probabilityHistory.reduce((a, b) => a + b, 0) / this.probabilityHistory.length
        : 1;
    const signalQuality = voiceActive ? clamp01(1 - meanProb) : 0;
    return {
      f0: f0 == null ? null : Math.round(f0 * 10) / 10,
      voiceActive,
      lastVoiceAt: this.lastVoiceAt,
      signalQuality,
      envelopeSample: this.latestRms,
    };
  }
}

export const VOICE_F0_RANGE = F0_RANGE_HZ;

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
