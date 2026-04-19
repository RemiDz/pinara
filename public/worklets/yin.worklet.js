/* Pinara — YIN pitch detection AudioWorklet processor.
 *
 * Mirrors the pure TypeScript port in components/biometrics/yin.ts.
 * AudioWorklet processors run in an isolated realm and cannot import
 * from the main bundle, so the algorithm is duplicated. Keep both
 * copies in sync — vitest covers the TS version.
 *
 * Buffer strategy: a 2048-sample ring (~43 ms at 48 kHz) is filled
 * by `process()` and YIN is run at ~10 Hz. Each emission carries the
 * detected F0 (or null), the YIN confidence, and the windowed RMS so
 * the main thread can gate on voice activity.
 */

const FRAME = 2048;
const EMIT_INTERVAL_S = 0.1;
const YIN_THRESHOLD = 0.15;

class YinProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(FRAME);
    this.head = 0;
    this.lastEmit = 0;
    this.scratch = new Float32Array(FRAME >> 1);
  }

  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch || ch.length === 0) return true;

    for (let i = 0; i < ch.length; i++) {
      this.buffer[this.head] = ch[i];
      this.head = (this.head + 1) % FRAME;
    }

    if (currentTime - this.lastEmit < EMIT_INTERVAL_S) return true;
    this.lastEmit = currentTime;

    // Snapshot the ring buffer in chronological order.
    const snap = new Float32Array(FRAME);
    for (let i = 0; i < FRAME; i++) {
      snap[i] = this.buffer[(this.head + i) % FRAME];
    }

    const rms = computeRMS(snap);
    const yinResult = detectPitchYin(snap, sampleRate, this.scratch, YIN_THRESHOLD);

    this.port.postMessage({
      f0: yinResult.f0,
      probability: yinResult.probability,
      rms,
      t: currentTime,
    });

    return true;
  }
}

function computeRMS(buf) {
  let s = 0;
  for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
  return Math.sqrt(s / buf.length);
}

function detectPitchYin(buffer, sr, yin, threshold) {
  const half = yin.length;

  for (let tau = 0; tau < half; tau++) {
    let sum = 0;
    for (let j = 0; j < half; j++) {
      const d = buffer[j] - buffer[j + tau];
      sum += d * d;
    }
    yin[tau] = sum;
  }

  yin[0] = 1;
  let running = 0;
  for (let tau = 1; tau < half; tau++) {
    running += yin[tau];
    yin[tau] = running > 0 ? (yin[tau] * tau) / running : 1;
  }

  let tau = -1;
  for (let t = 2; t < half; t++) {
    if (yin[t] < threshold) {
      while (t + 1 < half && yin[t + 1] < yin[t]) t++;
      tau = t;
      break;
    }
  }

  if (tau === -1) {
    let minVal = yin[2];
    let minTau = 2;
    for (let t = 3; t < half; t++) {
      if (yin[t] < minVal) {
        minVal = yin[t];
        minTau = t;
      }
    }
    if (minVal > 0.5) return { f0: null, probability: null };
    tau = minTau;
  }

  let refined = tau;
  if (tau > 0 && tau < half - 1) {
    const s0 = yin[tau - 1];
    const s1 = yin[tau];
    const s2 = yin[tau + 1];
    const denom = 2 * (2 * s1 - s2 - s0);
    if (denom !== 0) refined = tau + (s2 - s0) / denom;
  }

  if (refined <= 0) return { f0: null, probability: null };
  return { f0: sr / refined, probability: yin[tau] };
}

registerProcessor("yin", YinProcessor);
