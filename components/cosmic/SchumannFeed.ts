/**
 * Schumann resonance feed — client wrapper around /api/schumann.
 *
 * The route may proxy a live source (set SCHUMANN_FEED_URL in env)
 * or return a baseline derived from the canonical NOAA-published peaks
 * (7.83, 14.3, 20.8, 27.3, 33.8, 39, 45, 51 Hz). Phase 2 will modulate
 * audio layers from the live amplitude; Phase 1 simply visualises Kp.
 */

export type SchumannReading = {
  /** Fundamental frequency of the cavity, Hz. */
  fundamentalHz: number;
  /** Approximate amplitude (arbitrary units, normalised 0..1). */
  amplitude: number;
  /** Geomagnetic Kp index (0..9). High Kp = active field. */
  kp: number;
  /** Source label so the UI can show "live" vs "baseline". */
  source: "live" | "baseline";
  /** Server time of the reading, ISO string. */
  observedAt: string;
};

export async function fetchSchumann(signal?: AbortSignal): Promise<SchumannReading> {
  const res = await fetch("/api/schumann", { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`schumann feed ${res.status}`);
  return (await res.json()) as SchumannReading;
}
