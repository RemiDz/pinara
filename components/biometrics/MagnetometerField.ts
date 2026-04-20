/**
 * MagnetometerField — Phase 4 (Stream 8 in the extended bio set).
 *
 * Generic Sensor API Magnetometer is Chromium-only and behind a
 * permission flag. iOS Safari does not expose magnetometer data to
 * the web. Capability-gated; capability detection sets `magnetometer`
 * to false on unsupported browsers.
 *
 * Local geomagnetic baseline is derived from running mean. Anomalies
 * (deviation > 2σ) are flagged; the spec calls these out as "sacred
 * site" hints, framed experientially.
 */

export type MagnetometerReading = {
  /** Magnitude in microteslas */
  magnitudeUt: number;
  /** Deviation from running baseline */
  deltaUt: number;
  /** Anomaly flag — > 2σ from baseline */
  anomaly: boolean;
};

type Listener = (r: MagnetometerReading) => void;

type MagCtor = new (opts?: { frequency?: number }) => EventTarget & {
  x: number;
  y: number;
  z: number;
  start: () => void;
  stop: () => void;
};

const HISTORY = 120;

export class MagnetometerField {
  private sensor: ({ start: () => void; stop: () => void } & EventTarget) | null = null;
  private samples: number[] = [];
  private listeners = new Set<Listener>();

  static isSupported(): boolean {
    return typeof window !== "undefined" && "Magnetometer" in window;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  start(): boolean {
    if (!MagnetometerField.isSupported()) return false;
    const Ctor = (window as unknown as { Magnetometer?: MagCtor }).Magnetometer;
    if (!Ctor) return false;
    try {
      const sensor = new Ctor({ frequency: 5 });
      sensor.addEventListener("reading", () => {
        const m = Math.sqrt(sensor.x * sensor.x + sensor.y * sensor.y + sensor.z * sensor.z);
        this.samples.push(m);
        if (this.samples.length > HISTORY) this.samples.shift();
        this.emit(m);
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
    this.samples = [];
  }

  private emit(m: number): void {
    const mean = this.samples.reduce((a, b) => a + b, 0) / Math.max(1, this.samples.length);
    const variance = this.samples.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, this.samples.length);
    const sigma = Math.sqrt(variance);
    const delta = m - mean;
    const reading: MagnetometerReading = {
      magnitudeUt: Math.round(m * 100) / 100,
      deltaUt: Math.round(delta * 100) / 100,
      anomaly: sigma > 0 && Math.abs(delta) > 2 * sigma,
    };
    this.listeners.forEach((fn) => fn(reading));
  }
}
