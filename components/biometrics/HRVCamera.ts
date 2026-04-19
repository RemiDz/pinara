/**
 * HRVCamera — Stream 1 of seven (Phase 2.0).
 *
 * Photoplethysmography via the rear camera. The phone torch lights
 * the user's fingertip from the back; the camera captures the small
 * variation in red-channel brightness caused by capillary blood flow.
 * Detrending + bandpass + adaptive peak detection turn that into a
 * heart rate.
 *
 * All processing on the main thread for Phase 2; Phase 3 will move
 * the DSP into a worklet for sample-accurate timing.
 */

export type HRVReading = {
  /** Latest beats-per-minute estimate; null when calibrating */
  bpm: number | null;
  /** Most recent R-R intervals in ms (max 32) */
  rrIntervals: number[];
  /** Unix ms of last detected beat */
  lastBeatAt: number | null;
  /** 0..1 */
  signalQuality: number;
  /** Latest smoothed sample for visualisation */
  envelopeSample: number;
};

const SAMPLE_HZ = 30;
const ROI_SIZE = 64;
const MIN_BEAT_INTERVAL_MS = 300; // > 200 BPM is implausible at rest
const RR_WINDOW = 32;
const SAMPLE_BUFFER = SAMPLE_HZ * 8; // 8 seconds of samples

type Listener = (reading: HRVReading) => void;

export class HRVCamera {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private rafId: number | null = null;
  private intervalId: number | null = null;
  private stream: MediaStream | null = null;

  private rawSamples: number[] = [];
  private smoothedSamples: number[] = [];
  private rrIntervals: number[] = [];
  private lastBeatAt: number | null = null;
  private adaptiveThreshold = 0;

  private listeners = new Set<Listener>();

  /** Subscribe to readings. Returns an unsubscribe function. */
  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  async start(stream: MediaStream): Promise<void> {
    this.stop();
    this.stream = stream;

    this.video = document.createElement("video");
    this.video.srcObject = stream;
    this.video.muted = true;
    this.video.playsInline = true;
    await this.video.play();

    this.canvas = document.createElement("canvas");
    this.canvas.width = ROI_SIZE;
    this.canvas.height = ROI_SIZE;
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    if (!this.ctx) throw new Error("HRVCamera: 2D canvas unavailable");

    // Sample at SAMPLE_HZ via setInterval — rAF is too jittery on
    // mobile when the page is occluded, and we need uniform spacing.
    this.intervalId = window.setInterval(() => this.sampleFrame(), 1000 / SAMPLE_HZ);
  }

  stop(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }
    this.ctx = null;
    this.canvas = null;
    this.rawSamples = [];
    this.smoothedSamples = [];
    this.rrIntervals = [];
    this.lastBeatAt = null;
    this.adaptiveThreshold = 0;
  }

  private sampleFrame(): void {
    if (!this.video || !this.canvas || !this.ctx) return;
    if (this.video.readyState < 2) return;

    const sw = this.video.videoWidth;
    const sh = this.video.videoHeight;
    if (!sw || !sh) return;

    const sx = (sw - sw / 2) / 2;
    const sy = (sh - sh / 2) / 2;
    this.ctx.drawImage(
      this.video,
      sx,
      sy,
      sw / 2,
      sh / 2,
      0,
      0,
      ROI_SIZE,
      ROI_SIZE,
    );
    const data = this.ctx.getImageData(0, 0, ROI_SIZE, ROI_SIZE).data;

    // Mean of red channel only — green is also viable but the torch
    // signal is strongest in red on most phones.
    let sum = 0;
    const stride = 4;
    const px = (ROI_SIZE * ROI_SIZE) | 0;
    for (let i = 0; i < px; i++) sum += data[i * stride];
    const mean = sum / px;

    this.pushSample(mean, performance.now());
  }

  /** Public for tests + harness; runs the full DSP on a single sample. */
  pushSample(rawValue: number, nowMs: number = performance.now()): void {
    this.rawSamples.push(rawValue);
    if (this.rawSamples.length > SAMPLE_BUFFER) this.rawSamples.shift();

    // Need at least 2 seconds of data before producing meaningful
    // output; until then, just emit calibration readings.
    if (this.rawSamples.length < SAMPLE_HZ * 2) {
      this.emit({ envelopeSample: 0 });
      return;
    }

    // Detrending: subtract the running mean over the last second.
    const mean = movingMean(this.rawSamples, SAMPLE_HZ);
    const detrended = this.rawSamples.map((s) => s - mean);

    // Cheap low-pass: 5-tap moving average (cuts above ~3 Hz at 30 Hz).
    const smoothed = movingAverage(detrended, 5);
    this.smoothedSamples = smoothed;

    // Adaptive threshold: 60th percentile of last 4 seconds.
    const recent = smoothed.slice(-SAMPLE_HZ * 4);
    this.adaptiveThreshold = percentile(recent, 0.6);

    // Peak detection on the most recent sample only — we only ever
    // care about new beats.
    const last = smoothed.length - 1;
    if (last >= 2) {
      const a = smoothed[last - 2];
      const b = smoothed[last - 1];
      const c = smoothed[last];
      const isPeak = b > a && b > c && b > this.adaptiveThreshold;
      const intervalOK =
        this.lastBeatAt === null || nowMs - this.lastBeatAt >= MIN_BEAT_INTERVAL_MS;
      if (isPeak && intervalOK) {
        if (this.lastBeatAt !== null) {
          this.rrIntervals.push(nowMs - this.lastBeatAt);
          if (this.rrIntervals.length > RR_WINDOW) this.rrIntervals.shift();
        }
        this.lastBeatAt = nowMs;
      }
    }

    this.emit({ envelopeSample: smoothed[last] ?? 0 });
  }

  private emit(extra: { envelopeSample: number }): void {
    const reading = this.read(extra.envelopeSample);
    this.listeners.forEach((fn) => fn(reading));
  }

  /** Public so tests + harness can read without a callback. */
  read(envelopeSample = 0): HRVReading {
    const bpm = this.rrIntervals.length >= 4 ? 60_000 / median(this.rrIntervals) : null;
    const signalQuality = this.computeSignalQuality();
    return {
      bpm: bpm !== null ? Math.round(bpm) : null,
      rrIntervals: [...this.rrIntervals],
      lastBeatAt: this.lastBeatAt,
      signalQuality,
      envelopeSample,
    };
  }

  private computeSignalQuality(): number {
    if (this.rrIntervals.length < 4) return 0;
    const m = median(this.rrIntervals);
    const tol = m * 0.2;
    const inside = this.rrIntervals.filter((rr) => Math.abs(rr - m) <= tol).length;
    return inside / this.rrIntervals.length;
  }
}

// -------- pure helpers (also used by tests) --------

export function movingMean(samples: number[], window: number): number {
  const slice = samples.slice(-window);
  if (slice.length === 0) return 0;
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

export function movingAverage(samples: number[], window: number): number[] {
  const out = new Array<number>(samples.length).fill(0);
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i];
    if (i >= window) sum -= samples[i - window];
    out[i] = i < window ? sum / (i + 1) : sum / window;
  }
  return out;
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

/**
 * Generate a synthetic PPG signal at a known BPM with optional noise.
 * Used in tests to verify the peak detector recovers the correct BPM.
 */
export function syntheticPPG(opts: {
  bpm: number;
  durationSec: number;
  sampleHz?: number;
  noiseAmp?: number;
  randomSeed?: number;
}): { samples: number[]; expectedBeats: number } {
  const sampleHz = opts.sampleHz ?? SAMPLE_HZ;
  const noiseAmp = opts.noiseAmp ?? 0;
  let seed = opts.randomSeed ?? 1;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const total = Math.floor(opts.durationSec * sampleHz);
  const beatHz = opts.bpm / 60;
  const samples: number[] = [];
  for (let i = 0; i < total; i++) {
    const t = i / sampleHz;
    // Strong fundamental + small second harmonic + noise. DC offset to
    // match a real-camera mean-red value (~120/255).
    const v =
      120 +
      8 * Math.sin(2 * Math.PI * beatHz * t) +
      2 * Math.sin(4 * Math.PI * beatHz * t) +
      noiseAmp * (rand() - 0.5);
    samples.push(v);
  }
  return { samples, expectedBeats: Math.floor(opts.durationSec * beatHz) };
}
