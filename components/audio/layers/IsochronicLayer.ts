import * as Tone from "tone";

/**
 * Isochronic pulses — a single carrier amplitude-modulated by a
 * pulse wave at the entrainment frequency. Used as a no-headphones
 * fallback for the binaural layer; alone on speakers it's still
 * effective at gentle entrainment.
 *
 * Phase 3.1 ships manual on/off in the harness. Phase 3.2+ may add
 * heuristic headphone detection via mediaDevices labels.
 */
export class IsochronicLayer {
  private osc: Tone.Oscillator | null = null;
  private gateLfo: Tone.LFO | null = null;
  private gain: Tone.Gain | null = null;

  constructor(
    private readonly carrierHz: number,
    private readonly pulseHz: number,
    private readonly destination: Tone.ToneAudioNode,
  ) {}

  start(now: number) {
    this.gain = new Tone.Gain(0).connect(this.destination);
    this.osc = new Tone.Oscillator(this.carrierHz, "sine").connect(this.gain);
    // Square LFO between 0 and 1 at the entrainment rate gives a clean
    // isochronic envelope; we soften with a tiny ramp to avoid clicks.
    this.gateLfo = new Tone.LFO({ frequency: this.pulseHz, min: 0, max: 1, type: "square" });
    this.gateLfo.connect(this.gain.gain);
    this.osc.start(now);
    this.gateLfo.start(now);
    this.gain.gain.linearRampToValueAtTime(0.12, now + 6);
  }

  setGain(value: number, glideSec = 0.4): void {
    if (!this.gain) return;
    this.gain.gain.cancelScheduledValues(Tone.now());
    this.gain.gain.rampTo(value, glideSec);
  }

  fadeOut(now: number, durationSec: number) {
    this.gain?.gain.cancelScheduledValues(now);
    this.gain?.gain.linearRampToValueAtTime(0, now + durationSec);
    const stopAt = now + durationSec + 0.1;
    this.osc?.stop(stopAt);
    this.gateLfo?.stop(stopAt);
  }

  dispose() {
    this.osc?.dispose();
    this.gateLfo?.dispose();
    this.gain?.dispose();
    this.osc = null;
    this.gateLfo = null;
    this.gain = null;
  }
}
