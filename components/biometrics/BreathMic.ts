/**
 * BreathMic — Stream 2 of seven (Phase 2.0).
 *
 * Passive breath-rate detection from the microphone. Phone within
 * ~50 cm of the user's face picks up the soft hiss of inhale/exhale
 * even at low gain. We follow the audio envelope, detect onsets at
 * an adaptive threshold, and convert the inter-onset intervals to
 * a breath-per-minute estimate.
 *
 * Phase 2.0 uses an AnalyserNode + RAF read loop for simplicity.
 * Phase 3 will replace with a dedicated AudioWorklet for sample-
 * accurate timing.
 */

export type BreathReading = {
  bpm: number | null;
  lastInhaleAt: number | null;
  /** ratio of inhale to exhale duration; 1 = balanced */
  inhaleExhaleRatio: number | null;
  signalQuality: number;
  /** Latest envelope value 0..1, for visualisation */
  envelopeSample: number;
};

const ENVELOPE_ATTACK_MS = 80;
const ENVELOPE_RELEASE_MS = 250;
const MIN_BREATH_INTERVAL_MS = 1500; // >40 BPM is implausible at rest
const ONSET_HISTORY = 16;
const ENVELOPE_HISTORY = 256; // ~4 seconds at 60 Hz

type Listener = (reading: BreathReading) => void;

export class BreathMic {
  private ctxOwn = false;
  private audioCtx: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private buffer: Float32Array | null = null;
  private rafId: number | null = null;
  private stream: MediaStream | null = null;

  private envelope = 0;
  private envelopeHistory: number[] = [];
  private onsetHistory: number[] = [];
  private adaptiveThreshold = 0;
  private inOnset = false;

  private listeners = new Set<Listener>();
  private lastTickAt = 0;

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

    this.source = this.audioCtx.createMediaStreamSource(stream);
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.05;
    this.source.connect(this.analyser);
    this.buffer = new Float32Array(this.analyser.fftSize);

    this.lastTickAt = performance.now();
    const tick = () => {
      this.tick();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.source?.disconnect();
    this.analyser?.disconnect();
    this.source = null;
    this.analyser = null;
    this.buffer = null;
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.ctxOwn && this.audioCtx) {
      void this.audioCtx.close().catch(() => {});
    }
    this.audioCtx = null;
    this.ctxOwn = false;
    this.envelope = 0;
    this.envelopeHistory = [];
    this.onsetHistory = [];
    this.adaptiveThreshold = 0;
    this.inOnset = false;
  }

  private tick(): void {
    if (!this.analyser || !this.buffer) return;
    const now = performance.now();
    const dt = now - this.lastTickAt;
    this.lastTickAt = now;

    this.analyser.getFloatTimeDomainData(this.buffer);
    const rms = computeRMS(this.buffer);
    this.envelope = updateEnvelope(this.envelope, rms, dt, ENVELOPE_ATTACK_MS, ENVELOPE_RELEASE_MS);

    this.envelopeHistory.push(this.envelope);
    if (this.envelopeHistory.length > ENVELOPE_HISTORY) this.envelopeHistory.shift();

    if (this.envelopeHistory.length >= 60) {
      // Adaptive threshold = midpoint between the 30th and 80th
      // percentile of recent envelope samples.
      const lo = percentile(this.envelopeHistory, 0.3);
      const hi = percentile(this.envelopeHistory, 0.8);
      this.adaptiveThreshold = (lo + hi) / 2;

      const above = this.envelope > this.adaptiveThreshold;
      if (above && !this.inOnset) {
        this.inOnset = true;
        const last = this.onsetHistory[this.onsetHistory.length - 1];
        if (last === undefined || now - last >= MIN_BREATH_INTERVAL_MS) {
          this.onsetHistory.push(now);
          if (this.onsetHistory.length > ONSET_HISTORY) this.onsetHistory.shift();
        }
      } else if (!above) {
        this.inOnset = false;
      }
    }

    this.emit();
  }

  private emit(): void {
    const reading = this.read();
    this.listeners.forEach((fn) => fn(reading));
  }

  read(): BreathReading {
    const intervals: number[] = [];
    for (let i = 1; i < this.onsetHistory.length; i++) {
      intervals.push(this.onsetHistory[i] - this.onsetHistory[i - 1]);
    }
    const bpm = intervals.length >= 2 ? 60_000 / median(intervals) : null;
    const signalQuality = computeBreathSignalQuality(intervals);
    return {
      bpm: bpm !== null ? Math.round(bpm * 10) / 10 : null,
      lastInhaleAt: this.onsetHistory[this.onsetHistory.length - 1] ?? null,
      // Phase 2.0 doesn't separate inhale from exhale yet; return 1.
      inhaleExhaleRatio: bpm !== null ? 1 : null,
      signalQuality,
      envelopeSample: this.envelope,
    };
  }
}

// -------- pure helpers (also used by tests) --------

export function computeRMS(buffer: ArrayLike<number>): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
  return Math.sqrt(sum / buffer.length);
}

/**
 * Single-pole envelope follower with separate attack/release time
 * constants. Returns the new envelope value.
 */
export function updateEnvelope(
  current: number,
  target: number,
  dtMs: number,
  attackMs: number,
  releaseMs: number,
): number {
  const tau = target > current ? attackMs : releaseMs;
  const alpha = 1 - Math.exp(-dtMs / tau);
  return current + (target - current) * alpha;
}

export function percentile(samples: number[], p: number): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * p)));
  return sorted[idx];
}

export function median(samples: number[]): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function computeBreathSignalQuality(intervals: number[]): number {
  if (intervals.length < 2) return 0;
  const m = median(intervals);
  if (m === 0) return 0;
  const tol = m * 0.3;
  const inside = intervals.filter((rr) => Math.abs(rr - m) <= tol).length;
  return inside / intervals.length;
}
