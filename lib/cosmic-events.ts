/**
 * Cosmic-event detection — Phase 7. Lunar returns, solar gates,
 * windows of power. Pure functions over `astronomy-engine` results so
 * vitest can hold them honest.
 */

import { Body, Equator, MoonPhase as MoonPhaseDeg, SearchMoonPhase } from "astronomy-engine";

export type SolarGateKind = "spring_equinox" | "summer_solstice" | "autumn_equinox" | "winter_solstice" | "first_quarter" | "last_quarter" | "new_moon" | "full_moon";

export type SolarGateEvent = {
  kind: SolarGateKind;
  at: Date;
};

/**
 * Find the most recent and the next four moon-phase events from
 * `from`, returned in chronological order. Phase quarters: 0 = new,
 * 90 = first quarter, 180 = full, 270 = last quarter.
 */
export function upcomingMoonPhases(from: Date, count = 4): SolarGateEvent[] {
  const phases: { angle: number; kind: SolarGateKind }[] = [
    { angle: 0, kind: "new_moon" },
    { angle: 90, kind: "first_quarter" },
    { angle: 180, kind: "full_moon" },
    { angle: 270, kind: "last_quarter" },
  ];
  const out: SolarGateEvent[] = [];
  let cursor = from;
  while (out.length < count) {
    let earliest: { date: Date; kind: SolarGateKind } | null = null;
    for (const phase of phases) {
      const t = SearchMoonPhase(phase.angle, cursor, 35);
      if (!t) continue;
      if (!earliest || t.date < earliest.date) earliest = { date: t.date, kind: phase.kind };
    }
    if (!earliest) break;
    out.push({ kind: earliest.kind, at: earliest.date });
    cursor = new Date(earliest.date.getTime() + 60_000);
  }
  return out;
}

/**
 * Coarse solstice / equinox detection by ecliptic longitude of the Sun.
 * Returns one of the four seasonal events nearest to `from`.
 */
export function nextSolarGate(from: Date): SolarGateEvent | null {
  const targetLongitudes: { lon: number; kind: SolarGateKind }[] = [
    { lon: 0, kind: "spring_equinox" },
    { lon: 90, kind: "summer_solstice" },
    { lon: 180, kind: "autumn_equinox" },
    { lon: 270, kind: "winter_solstice" },
  ];
  let best: SolarGateEvent | null = null;
  for (const t of targetLongitudes) {
    const event = searchSunLongitude(t.lon, from, 200);
    if (!event) continue;
    if (!best || event < best.at) best = { kind: t.kind, at: event };
  }
  return best;
}

function searchSunLongitude(targetLonDeg: number, start: Date, maxDays: number): Date | null {
  // Coarse bisection over ecliptic longitude. Adequate for ±1 hour
  // resolution which is plenty for "show a gate" UX.
  let lo = start;
  let hi = new Date(start.getTime() + maxDays * 86_400_000);
  for (let i = 0; i < 40; i++) {
    const mid = new Date((lo.getTime() + hi.getTime()) / 2);
    const lon = sunEclipticLongitude(mid);
    const target = ((targetLonDeg + 360) % 360);
    const delta = ((lon - target + 540) % 360) - 180;
    if (Math.abs(delta) < 0.0005) return mid;
    if (delta < 0) lo = mid; else hi = mid;
  }
  return new Date((lo.getTime() + hi.getTime()) / 2);
}

function sunEclipticLongitude(date: Date): number {
  // Approximate ecliptic longitude via equatorial RA → ecliptic.
  const equ = Equator(Body.Sun, date, { latitude: 0, longitude: 0, height: 0 } as unknown as never, true, true);
  return ((equ.ra * 15) + 360) % 360;
}

/**
 * Find the next "lunar return" — the next time the Moon reaches its
 * natal longitude. `natalMoonLongitude` is degrees 0..360.
 */
export function nextLunarReturn(natalMoonLongitude: number, from: Date): Date | null {
  const target = ((natalMoonLongitude % 360) + 360) % 360;
  // The Moon advances ~13.18°/day, full cycle ~27.32 days.
  let lo = from;
  let hi = new Date(from.getTime() + 30 * 86_400_000);
  for (let i = 0; i < 60; i++) {
    const mid = new Date((lo.getTime() + hi.getTime()) / 2);
    const m = MoonPhaseDeg(mid); // moon - sun longitude difference; not the absolute longitude.
    void m; // we don't need this value here — we use targetMoonLongitude below
    const moonLon = approxMoonLongitude(mid);
    const delta = ((moonLon - target + 540) % 360) - 180;
    if (Math.abs(delta) < 0.05) return mid;
    if (delta < 0) lo = mid; else hi = mid;
  }
  return null;
}

function approxMoonLongitude(date: Date): number {
  // Use Equator to get RA, convert to degrees as a coarse longitude
  // proxy for return detection (within ~1°). High-precision lunar
  // returns wait for the pyswisseph backend in Phase 4 of cosmic
  // hardening.
  const equ = Equator(Body.Moon, date, { latitude: 0, longitude: 0, height: 0 } as unknown as never, true, true);
  return ((equ.ra * 15) + 360) % 360;
}

export type WindowOfPower = {
  open: boolean;
  reason: string;
  expiresAt: Date | null;
};

/**
 * "Windows of power" detection — current planetary hour matches the
 * user's natal Sun-sign ruler AND Schumann Kp is elevated AND the
 * Moon phase aligns with the active intent's natural rhythm.
 */
export function detectWindowOfPower(input: {
  currentPlanet: string;
  natalRulerPlanet: string | null;
  schumannKp: number | null;
  intentId: string;
  moonPhaseFraction: number; // 0..1
  hourEndsAt: Date;
}): WindowOfPower {
  if (!input.natalRulerPlanet) return { open: false, reason: "no_natal_data", expiresAt: null };
  const planetMatch = input.currentPlanet === input.natalRulerPlanet;
  const kpElevated = (input.schumannKp ?? 0) > 3;
  const intentLunarOk = intentMoonAlignment(input.intentId, input.moonPhaseFraction);
  if (planetMatch && kpElevated && intentLunarOk) {
    return { open: true, reason: "all_aligned", expiresAt: input.hourEndsAt };
  }
  return { open: false, reason: "not_aligned", expiresAt: null };
}

function intentMoonAlignment(intentId: string, illum: number): boolean {
  // Coarse alignment: clearing/release thrives near full → waning;
  // open/see thrives near new → waxing; rest neutral.
  switch (intentId) {
    case "release":
    case "clear": return illum > 0.6;
    case "open":
    case "see": return illum < 0.4;
    case "remember": return illum >= 0.4 && illum <= 0.6;
    default: return true;
  }
}
