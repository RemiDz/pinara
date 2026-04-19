/**
 * Cosmic math — astronomy-engine wrappers.
 *
 * Phase 1 covers: planetary hour, Moon phase + illumination, Sun position.
 * Solar wind, geomagnetic, and Schumann data come from external feeds
 * (see /api/schumann, /api/solar-wind in later phases).
 *
 * Planetary hour follows the classical Chaldean order over the 24 hours
 * between sunrise and sunrise. Day hours and night hours are unequal
 * unless at the equinox. Day-of-week ruler order: Sun, Moon, Mars,
 * Mercury, Jupiter, Venus, Saturn (Sun = Sunday). Within each day we
 * cycle the seven planets in Chaldean order: Saturn, Jupiter, Mars,
 * Sun, Venus, Mercury, Moon.
 */

import {
  Body,
  Equator,
  Horizon,
  Illumination,
  MoonPhase as MoonPhaseDeg,
  Observer,
  SearchRiseSet,
} from "astronomy-engine";

export type Planet =
  | "sun"
  | "moon"
  | "mars"
  | "mercury"
  | "jupiter"
  | "venus"
  | "saturn";

const CHALDEAN_ORDER: Planet[] = [
  "saturn",
  "jupiter",
  "mars",
  "sun",
  "venus",
  "mercury",
  "moon",
];

// Sunday = 0
const DAY_RULERS: Planet[] = [
  "sun",
  "moon",
  "mars",
  "mercury",
  "jupiter",
  "venus",
  "saturn",
];

export type PlanetaryHour = {
  planet: Planet;
  startsAt: Date;
  endsAt: Date;
  isDayHour: boolean;
  /** Index 0..23 across the planetary day (sunrise → next sunrise) */
  index: number;
};

function rulerIndexInChaldean(p: Planet): number {
  return CHALDEAN_ORDER.indexOf(p);
}

function planetForOffset(startRuler: Planet, offset: number): Planet {
  const idx = (rulerIndexInChaldean(startRuler) + offset + 7 * 100) % 7;
  return CHALDEAN_ORDER[idx];
}

/**
 * Compute the current planetary hour for the given location and instant.
 * Falls back to a degenerate "always Sun" result inside the polar circles
 * when the Sun does not rise/set on the day in question — a deliberately
 * conservative fallback rather than throwing.
 */
export function getPlanetaryHour(
  now: Date,
  lat: number,
  lng: number,
): PlanetaryHour {
  const observer = new Observer(lat, lng, 0);

  // Find the most recent sunrise prior to `now`. SearchRiseSet is inclusive
  // of `dateStart`, so when chaining we always advance the start past the
  // event we just found, otherwise the same event is returned again.
  let searchStart = new Date(now.getTime() - 24 * 3600 * 1000);
  let lastSunrise: Date | null = null;
  let nextSunset: Date | null = null;
  let nextSunrise: Date | null = null;

  for (let i = 0; i < 3; i++) {
    const rise = SearchRiseSet(Body.Sun, observer, +1, searchStart, 2);
    if (rise && rise.date <= now) {
      lastSunrise = rise.date;
      const set = SearchRiseSet(Body.Sun, observer, -1, lastSunrise, 2);
      if (set) {
        nextSunset = set.date;
        // Tomorrow's sunrise — search starting from sunset to skip today's.
        const next = SearchRiseSet(Body.Sun, observer, +1, nextSunset, 2);
        if (next) nextSunrise = next.date;
      }
      break;
    }
    searchStart = new Date(searchStart.getTime() - 24 * 3600 * 1000);
  }

  if (!lastSunrise || !nextSunset || !nextSunrise) {
    // Degenerate polar fallback — keep the field functional, mark as Sun.
    const sentinelStart = new Date(Math.floor(now.getTime() / 3_600_000) * 3_600_000);
    return {
      planet: "sun",
      startsAt: sentinelStart,
      endsAt: new Date(sentinelStart.getTime() + 3_600_000),
      isDayHour: true,
      index: 0,
    };
  }

  const dayLengthMs = nextSunset.getTime() - lastSunrise.getTime();
  const nightLengthMs = nextSunrise.getTime() - nextSunset.getTime();
  const dayHourMs = dayLengthMs / 12;
  const nightHourMs = nightLengthMs / 12;

  // The first day hour is ruled by the day-of-week ruler.
  const dow = lastSunrise.getDay(); // 0..6 Sun..Sat
  const startRuler = DAY_RULERS[dow];

  const sinceSunrise = now.getTime() - lastSunrise.getTime();

  let index: number;
  let hourStart: Date;
  let hourEnd: Date;
  let isDayHour: boolean;

  if (sinceSunrise < dayLengthMs) {
    index = Math.min(11, Math.floor(sinceSunrise / dayHourMs));
    hourStart = new Date(lastSunrise.getTime() + index * dayHourMs);
    hourEnd = new Date(hourStart.getTime() + dayHourMs);
    isDayHour = true;
  } else {
    const sinceSunset = now.getTime() - nextSunset.getTime();
    const nightIdx = Math.min(11, Math.floor(sinceSunset / nightHourMs));
    index = 12 + nightIdx;
    hourStart = new Date(nextSunset.getTime() + nightIdx * nightHourMs);
    hourEnd = new Date(hourStart.getTime() + nightHourMs);
    isDayHour = false;
  }

  const planet = planetForOffset(startRuler, index);

  return { planet, startsAt: hourStart, endsAt: hourEnd, isDayHour, index };
}

// ----- Moon phase -----

export type MoonPhaseInfo = {
  /** 0–360° elongation from Sun */
  phaseAngle: number;
  /** 0..1 */
  illumination: number;
  /** Discrete name */
  phaseName: MoonPhaseName;
  /** Approximate age in days from new moon */
  ageDays: number;
};

export type MoonPhaseName =
  | "new"
  | "waxing_crescent"
  | "first_quarter"
  | "waxing_gibbous"
  | "full"
  | "waning_gibbous"
  | "last_quarter"
  | "waning_crescent";

const SYNODIC_DAYS = 29.530588;

function nameForPhaseAngle(deg: number): MoonPhaseName {
  // Octants ±22.5° around the cardinal angles.
  const a = ((deg % 360) + 360) % 360;
  if (a < 22.5 || a >= 337.5) return "new";
  if (a < 67.5) return "waxing_crescent";
  if (a < 112.5) return "first_quarter";
  if (a < 157.5) return "waxing_gibbous";
  if (a < 202.5) return "full";
  if (a < 247.5) return "waning_gibbous";
  if (a < 292.5) return "last_quarter";
  return "waning_crescent";
}

export function getMoonPhase(now: Date): MoonPhaseInfo {
  const phaseAngle = MoonPhaseDeg(now);
  const illum = Illumination(Body.Moon, now);
  const phaseName = nameForPhaseAngle(phaseAngle);
  const ageDays = (phaseAngle / 360) * SYNODIC_DAYS;
  return {
    phaseAngle,
    illumination: illum.phase_fraction,
    phaseName,
    ageDays,
  };
}

// ----- Sun position -----

export type SunPosition = {
  altitudeDeg: number;
  azimuthDeg: number;
  isDaytime: boolean;
};

export function getSunPosition(now: Date, lat: number, lng: number): SunPosition {
  const observer = new Observer(lat, lng, 0);
  const equ = Equator(Body.Sun, now, observer, true, true);
  const horizon = Horizon(now, observer, equ.ra, equ.dec, "normal");
  return {
    altitudeDeg: horizon.altitude,
    azimuthDeg: horizon.azimuth,
    isDaytime: horizon.altitude > 0,
  };
}
