import * as Tone from "tone";

/**
 * Harmonic / overtone layer — Phase 1 ships a single solfeggio overtone
 * (936 Hz default, pineal-associated). Phase 2 will expand this into
 * a Moon-phase tuned harmonic series (new = fundamental only,
 * full = full series).
 */
export class HarmonicLayer {
  private osc: Tone.Oscillator | null = null;
  private gain: Tone.Gain | null = null;
  private tremolo: Tone.Tremolo | null = null;

  constructor(
    private readonly overtoneHz: number,
    private readonly destination: Tone.ToneAudioNode,
  ) {}

  start(now: number) {
    this.gain = new Tone.Gain(0).connect(this.destination);
    this.tremolo = new Tone.Tremolo(0.09, 0.4).start(now).connect(this.gain);
    this.osc = new Tone.Oscillator(this.overtoneHz, "sine").connect(this.tremolo);
    this.osc.start(now);
    this.gain.gain.linearRampToValueAtTime(0.06, now + 12);
  }

  fadeOut(now: number, durationSec: number) {
    this.gain?.gain.cancelScheduledValues(now);
    this.gain?.gain.linearRampToValueAtTime(0, now + durationSec);
    const stopAt = now + durationSec + 0.1;
    this.osc?.stop(stopAt);
    this.tremolo?.stop(stopAt);
  }

  dispose() {
    this.osc?.dispose();
    this.tremolo?.dispose();
    this.gain?.dispose();
    this.osc = null;
    this.tremolo = null;
    this.gain = null;
  }
}
