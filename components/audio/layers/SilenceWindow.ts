import * as Tone from "tone";

/**
 * Silence windows — parametric 3–7 s listening intervals scheduled
 * at intent-dependent cadences. The master gain is the target; the
 * silence window dips it with a cosine fade and restores it.
 *
 * Cadence is driven by the composer, which can lengthen intervals
 * when HRV coherence is high (practitioner is settled, ready for
 * more open space) and cancel them when drift spikes.
 */

export type SilenceParams = {
  /** Seconds between windows */
  intervalSec: number;
  /** Seconds of silence per window */
  durationSec: number;
  /** Fade time into and out of silence, seconds */
  fadeSec: number;
};

export class SilenceWindowController {
  private timeoutId: number | null = null;
  private params: SilenceParams;
  private inSilence = false;
  private lastSilenceStart: number | null = null;

  constructor(
    private readonly masterGain: Tone.Gain,
    params: SilenceParams,
  ) {
    this.params = params;
  }

  start(): void {
    this.scheduleNext();
  }

  setParams(next: Partial<SilenceParams>): void {
    this.params = { ...this.params, ...next };
  }

  getParams(): SilenceParams {
    return { ...this.params };
  }

  getLastSilenceStart(): number | null {
    return this.lastSilenceStart;
  }

  cancelPending(): void {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  stop(): void {
    this.cancelPending();
    this.inSilence = false;
  }

  private scheduleNext(): void {
    if (this.timeoutId !== null) window.clearTimeout(this.timeoutId);
    const inSec = this.params.intervalSec;
    this.timeoutId = window.setTimeout(() => this.openWindow(), inSec * 1000);
  }

  private openWindow(): void {
    const now = Tone.now();
    this.inSilence = true;
    this.lastSilenceStart = Date.now();
    const g = this.masterGain.gain;
    const target = this.masterGain.gain.value;
    // Fade down, hold, fade back up.
    g.cancelScheduledValues(now);
    g.linearRampToValueAtTime(0, now + this.params.fadeSec);
    g.setValueAtTime(0, now + this.params.fadeSec + (this.params.durationSec - 2 * this.params.fadeSec));
    g.linearRampToValueAtTime(target, now + this.params.durationSec);
    this.timeoutId = window.setTimeout(() => {
      this.inSilence = false;
      this.scheduleNext();
    }, this.params.durationSec * 1000);
  }
}
