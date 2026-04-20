import * as Tone from "tone";

/**
 * Drone bed — fat oscillator at the Schumann-tuned root, with a
 * very slow LFO on detune to keep it from sounding static.
 */
export class DroneLayer {
  private osc: Tone.FatOscillator | null = null;
  private filter: Tone.Filter | null = null;
  private gain: Tone.Gain | null = null;
  private lfo: Tone.LFO | null = null;

  constructor(
    private readonly fundamentalHz: number,
    private readonly destination: Tone.ToneAudioNode,
  ) {}

  start(now: number) {
    this.gain = new Tone.Gain(0).connect(this.destination);
    this.filter = new Tone.Filter(800, "lowpass").connect(this.gain);
    this.osc = new Tone.FatOscillator(this.fundamentalHz, "sine", 18);
    this.osc.spread = 24;
    this.osc.connect(this.filter);
    this.osc.start(now);
    this.lfo = new Tone.LFO(0.07, -8, 8);
    this.lfo.connect(this.osc.detune);
    this.lfo.start(now);
    this.gain.gain.linearRampToValueAtTime(0.22, now + 8);
  }

  /** Retune drone fundamental over `glideSec` seconds. */
  retune(hz: number, glideSec = 2): void {
    if (!this.osc) return;
    this.osc.frequency.cancelScheduledValues(Tone.now());
    this.osc.frequency.rampTo(hz, glideSec);
  }

  /** Live target gain (post fade-in baseline). */
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
    this.lfo?.stop(stopAt);
  }

  dispose() {
    this.osc?.dispose();
    this.lfo?.dispose();
    this.filter?.dispose();
    this.gain?.dispose();
    this.osc = null;
    this.lfo = null;
    this.filter = null;
    this.gain = null;
  }
}
