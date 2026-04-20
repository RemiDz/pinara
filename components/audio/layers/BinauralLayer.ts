import * as Tone from "tone";

/**
 * Binaural carrier — two sine oscillators offset by `offsetHz`,
 * panned hard left and right. Headphones required for the beat
 * to perceive; isochronic fallback is in IsochronicLayer.
 */
export class BinauralLayer {
  private leftOsc: Tone.Oscillator | null = null;
  private rightOsc: Tone.Oscillator | null = null;
  private leftPanner: Tone.Panner | null = null;
  private rightPanner: Tone.Panner | null = null;
  private gain: Tone.Gain | null = null;

  constructor(
    private readonly carrierHz: number,
    private readonly offsetHz: number,
    private readonly destination: Tone.ToneAudioNode,
  ) {}

  start(now: number) {
    const half = this.offsetHz / 2;
    this.gain = new Tone.Gain(0).connect(this.destination);
    this.leftPanner = new Tone.Panner(-1).connect(this.gain);
    this.rightPanner = new Tone.Panner(1).connect(this.gain);
    this.leftOsc = new Tone.Oscillator(this.carrierHz - half, "sine").connect(this.leftPanner);
    this.rightOsc = new Tone.Oscillator(this.carrierHz + half, "sine").connect(this.rightPanner);
    this.leftOsc.start(now);
    this.rightOsc.start(now);
    this.gain.gain.linearRampToValueAtTime(0.18, now + 6);
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
    this.leftOsc?.stop(stopAt);
    this.rightOsc?.stop(stopAt);
  }

  dispose() {
    this.leftOsc?.dispose();
    this.rightOsc?.dispose();
    this.leftPanner?.dispose();
    this.rightPanner?.dispose();
    this.gain?.dispose();
    this.leftOsc = null;
    this.rightOsc = null;
    this.leftPanner = null;
    this.rightPanner = null;
    this.gain = null;
  }
}
