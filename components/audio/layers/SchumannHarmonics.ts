import * as Tone from "tone";

/**
 * Schumann cavity harmonics — all eight canonical peaks simultaneously.
 *
 * Peak amplitudes in the real cavity roll off geometrically with mode
 * number; we mirror that with a geometric gain envelope, scaled by
 * the live Kp reading (elevated geomagnetic activity → louder
 * higher modes).
 *
 * Root frequencies here are too low for direct perception (7.83 Hz
 * is sub-audible), so we render each peak as a carrier at the peak
 * frequency amplitude-modulating a musical root. The result is a
 * family of tremolo-like pulsations at the peak rates on top of
 * quiet pure tones.
 */

const PEAKS_HZ = [7.83, 14.3, 20.8, 27.3, 33.8, 39, 45, 51];
const BASE_ROOT_HZ = 108; // A 108 Hz chosen for sub-perceptual C# that beats with 7.83 gracefully

export class SchumannHarmonicsLayer {
  private oscillators: Tone.Oscillator[] = [];
  private lfos: Tone.LFO[] = [];
  private gains: Tone.Gain[] = [];
  private master: Tone.Gain | null = null;

  constructor(private readonly destination: Tone.ToneAudioNode) {}

  start(now: number) {
    this.master = new Tone.Gain(0).connect(this.destination);
    for (let i = 0; i < PEAKS_HZ.length; i++) {
      const peakHz = PEAKS_HZ[i];
      const perPeakGain = new Tone.Gain(0).connect(this.master);
      const carrier = new Tone.Oscillator(BASE_ROOT_HZ * (i + 1), "sine").connect(perPeakGain);
      const lfo = new Tone.LFO(peakHz, 0, 1);
      lfo.connect(perPeakGain.gain);
      carrier.start(now);
      lfo.start(now);
      this.oscillators.push(carrier);
      this.lfos.push(lfo);
      this.gains.push(perPeakGain);
    }
    this.setKp(2);
    this.master.gain.linearRampToValueAtTime(0.08, now + 12);
  }

  /** Kp 0..9 → amplitude ramp across the eight modes. */
  setKp(kp: number): void {
    if (!this.master) return;
    const clamped = Math.max(0, Math.min(9, kp));
    for (let i = 0; i < PEAKS_HZ.length; i++) {
      // Each successive mode attenuated by 0.55; elevated Kp brings
      // higher modes closer to the fundamental.
      const rolloff = Math.pow(0.55 + 0.03 * clamped, i);
      this.gains[i]?.gain.cancelScheduledValues(Tone.now());
      this.gains[i]?.gain.rampTo(0.04 * rolloff, 0.8);
    }
  }

  setGain(g: number): void {
    this.master?.gain.cancelScheduledValues(Tone.now());
    this.master?.gain.rampTo(g, 0.4);
  }

  fadeOut(now: number, durationSec: number) {
    this.master?.gain.cancelScheduledValues(now);
    this.master?.gain.linearRampToValueAtTime(0, now + durationSec);
    const stopAt = now + durationSec + 0.1;
    this.oscillators.forEach((o) => o.stop(stopAt));
    this.lfos.forEach((l) => l.stop(stopAt));
  }

  dispose() {
    this.oscillators.forEach((o) => o.dispose());
    this.lfos.forEach((l) => l.dispose());
    this.gains.forEach((g) => g.dispose());
    this.master?.dispose();
    this.oscillators = [];
    this.lfos = [];
    this.gains = [];
    this.master = null;
  }
}
