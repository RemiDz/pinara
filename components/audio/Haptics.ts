/**
 * Haptics — Phase 3.2.
 *
 * Heart-pulse pattern: vibrate at the user's measured HRV BPM (or
 * synthetic 60 BPM fallback) when the phone is on the chest.
 * Breath-pacing pattern: gentle pulses at the active intent's
 * target breath BPM. Session-milestone pattern: distinctive triple
 * pulse at 25 / 50 / 75 % completion and a longer pattern at end.
 *
 * Vibration API is supported on Android Chrome and iOS Safari (limited);
 * the API silently no-ops where unavailable.
 */

export type HapticPattern = "heart" | "breath" | "milestone" | "gate";

export class Haptics {
  private heartIntervalId: number | null = null;
  private breathIntervalId: number | null = null;
  private currentBpm = 0;
  private currentBreathBpm = 0;

  isSupported(): boolean {
    return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
  }

  /** Start tactile heart-pulse at `bpm`. Idempotent — call again to
   *  retune. Pass 0 to stop. */
  setHeartBpm(bpm: number): void {
    if (!this.isSupported()) return;
    if (this.currentBpm === bpm) return;
    this.currentBpm = bpm;
    if (this.heartIntervalId !== null) {
      window.clearInterval(this.heartIntervalId);
      this.heartIntervalId = null;
    }
    if (bpm <= 0) return;
    const periodMs = 60_000 / bpm;
    this.heartIntervalId = window.setInterval(() => {
      try {
        navigator.vibrate?.([20, 60, 30]);
      } catch {
        /* */
      }
    }, periodMs);
  }

  setBreathBpm(bpm: number): void {
    if (!this.isSupported()) return;
    if (this.currentBreathBpm === bpm) return;
    this.currentBreathBpm = bpm;
    if (this.breathIntervalId !== null) {
      window.clearInterval(this.breathIntervalId);
      this.breathIntervalId = null;
    }
    if (bpm <= 0) return;
    const periodMs = 60_000 / bpm;
    this.breathIntervalId = window.setInterval(() => {
      try {
        navigator.vibrate?.(40);
      } catch {
        /* */
      }
    }, periodMs);
  }

  pulse(pattern: HapticPattern): void {
    if (!this.isSupported()) return;
    try {
      switch (pattern) {
        case "milestone":
          navigator.vibrate?.([20, 80, 20, 80, 20]);
          break;
        case "gate":
          navigator.vibrate?.([60, 100, 60, 100, 60, 100, 100]);
          break;
        case "heart":
          navigator.vibrate?.([20, 60, 30]);
          break;
        case "breath":
          navigator.vibrate?.(40);
          break;
      }
    } catch {
      /* */
    }
  }

  stop(): void {
    if (this.heartIntervalId !== null) window.clearInterval(this.heartIntervalId);
    if (this.breathIntervalId !== null) window.clearInterval(this.breathIntervalId);
    this.heartIntervalId = null;
    this.breathIntervalId = null;
    this.currentBpm = 0;
    this.currentBreathBpm = 0;
    try {
      navigator.vibrate?.(0);
    } catch {
      /* */
    }
  }
}
