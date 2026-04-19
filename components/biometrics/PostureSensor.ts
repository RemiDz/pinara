/**
 * PostureSensor — Stream 7 of seven (Phase 2.1).
 *
 * DeviceMotion + DeviceOrientation give us:
 *   - stillness (0–1, inverse of recent acceleration variance)
 *   - orientation class: upright / flat-up / flat-down / chest / unknown
 *
 * iOS 13+ requires an explicit user-gesture-driven permission
 * request — handled separately via `requestMotion()` in lib/permissions.ts.
 * On Android and other platforms the events fire without prompting.
 *
 * Sustained stillness contributes to the depth score in CoherenceLoop
 * (Phase 2.1 will extend the fusion accordingly).
 */

export type PostureClass =
  | "unknown"
  | "upright"
  | "flat_face_up"
  | "flat_face_down"
  | "on_chest"
  | "tilted";

export type PostureReading = {
  /** 0..1 — 1 = perfectly still, 0 = constant motion */
  stillness: number;
  /** Discrete orientation class */
  orientation: PostureClass;
  /** Accel magnitude variance over the last second (m/s²)² */
  accelVariance: number;
  /** Beta + gamma + alpha summed in degrees, for visualisation */
  rotationMagnitude: number;
};

type Listener = (reading: PostureReading) => void;

const ACCEL_HISTORY = 60; // ~1 s at 60 Hz event rate

export class PostureSensor {
  private accelMagHistory: number[] = [];
  private listeners = new Set<Listener>();
  private latestBeta = 0;
  private latestGamma = 0;
  private latestAlpha = 0;
  private rafId: number | null = null;
  private started = false;

  private onMotion = (e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity;
    if (!a) return;
    const x = a.x ?? 0;
    const y = a.y ?? 0;
    const z = a.z ?? 0;
    const mag = Math.sqrt(x * x + y * y + z * z);
    this.accelMagHistory.push(mag);
    if (this.accelMagHistory.length > ACCEL_HISTORY) this.accelMagHistory.shift();
  };

  private onOrientation = (e: DeviceOrientationEvent) => {
    this.latestAlpha = e.alpha ?? 0;
    this.latestBeta = e.beta ?? 0;
    this.latestGamma = e.gamma ?? 0;
  };

  start(): void {
    if (this.started) return;
    if (typeof window === "undefined") return;
    this.started = true;
    window.addEventListener("devicemotion", this.onMotion as EventListener);
    window.addEventListener("deviceorientation", this.onOrientation as EventListener);
    const tick = () => {
      this.emit();
      this.rafId = window.requestAnimationFrame(tick);
    };
    this.rafId = window.requestAnimationFrame(tick);
  }

  stop(): void {
    if (typeof window === "undefined") return;
    window.removeEventListener("devicemotion", this.onMotion as EventListener);
    window.removeEventListener("deviceorientation", this.onOrientation as EventListener);
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.started = false;
    this.accelMagHistory = [];
    this.latestAlpha = 0;
    this.latestBeta = 0;
    this.latestGamma = 0;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  read(): PostureReading {
    const variance = computeVariance(this.accelMagHistory);
    // Stillness inversely proportional to variance, with a soft cap
    // around 1 (m/s²)² being "completely fidgety". Held devices have
    // ~0.05 variance from gravity micro-movements.
    const stillness = clamp01(1 - Math.min(1, variance));
    const orientation = classifyOrientation(this.latestBeta, this.latestGamma);
    const rotation =
      Math.abs(this.latestAlpha) +
      Math.abs(this.latestBeta) +
      Math.abs(this.latestGamma);
    return {
      stillness: Math.round(stillness * 100) / 100,
      orientation,
      accelVariance: Math.round(variance * 1000) / 1000,
      rotationMagnitude: Math.round(rotation * 10) / 10,
    };
  }

  private emit(): void {
    const reading = this.read();
    this.listeners.forEach((fn) => fn(reading));
  }
}

// -------- pure helpers (also used by tests) --------

export function computeVariance(samples: number[]): number {
  if (samples.length < 2) return 0;
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const sq = samples.reduce((a, b) => a + (b - mean) ** 2, 0);
  return sq / (samples.length - 1);
}

/**
 * Classify orientation from beta (front-back tilt, -180..180°) and
 * gamma (left-right tilt, -90..90°). Heuristic but adequate for
 * the experiential framing the spec targets.
 */
export function classifyOrientation(beta: number, gamma: number): PostureClass {
  const absBeta = Math.abs(beta);
  const absGamma = Math.abs(gamma);
  if (absBeta < 25 && absGamma < 25) {
    // Roughly horizontal. Beta near 0 + small gamma → flat.
    return beta >= 0 ? "flat_face_up" : "flat_face_down";
  }
  if (absBeta > 65 && absBeta < 115 && absGamma < 35) {
    return "upright";
  }
  if (absBeta < 60 && beta > 25 && absGamma < 30) {
    // Phone tilted toward chest (held against torso, lying back).
    return "on_chest";
  }
  return "tilted";
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
