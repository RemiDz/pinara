/**
 * Barometer — Phase 4. Pressure sensor where available (Android
 * Chrome with Generic Sensor API enabled). iOS does not expose this.
 *
 * Used as a slow modulation source for drone density rather than a
 * precise altimeter; we only care about deltas from baseline.
 */

export type BarometerReading = {
  pressureHpa: number;
  /** Delta from session baseline */
  deltaHpa: number;
};

type Listener = (r: BarometerReading) => void;
type Ctor = new (opts?: { frequency?: number }) => EventTarget & {
  pressure: number;
  start: () => void;
  stop: () => void;
};

export class Barometer {
  private sensor: ({ start: () => void; stop: () => void } & EventTarget) | null = null;
  private baseline: number | null = null;
  private listeners = new Set<Listener>();

  static isSupported(): boolean {
    return typeof window !== "undefined" && "Barometer" in window;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  start(): boolean {
    if (!Barometer.isSupported()) return false;
    const Ctor = (window as unknown as { Barometer?: Ctor }).Barometer;
    if (!Ctor) return false;
    try {
      const sensor = new Ctor({ frequency: 1 });
      sensor.addEventListener("reading", () => {
        const p = sensor.pressure;
        if (this.baseline == null) this.baseline = p;
        const reading: BarometerReading = {
          pressureHpa: Math.round(p * 10) / 10,
          deltaHpa: Math.round((p - this.baseline) * 100) / 100,
        };
        this.listeners.forEach((fn) => fn(reading));
      });
      sensor.start();
      this.sensor = sensor as { start: () => void; stop: () => void } & EventTarget;
      return true;
    } catch {
      return false;
    }
  }

  stop(): void {
    this.sensor?.stop();
    this.sensor = null;
    this.baseline = null;
  }
}
