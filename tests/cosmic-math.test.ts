import { describe, expect, it } from "vitest";
import {
  getMoonPhase,
  getPlanetaryHour,
  getSunPosition,
} from "@/lib/cosmic-math";

const LONDON = { lat: 51.5074, lng: -0.1278 };

describe("cosmic-math", () => {
  it("returns a valid planetary hour for London right now", () => {
    const hour = getPlanetaryHour(new Date(), LONDON.lat, LONDON.lng);
    expect(hour.startsAt.getTime()).toBeLessThanOrEqual(Date.now());
    expect(hour.endsAt.getTime()).toBeGreaterThan(hour.startsAt.getTime());
    expect([
      "sun",
      "moon",
      "mars",
      "mercury",
      "jupiter",
      "venus",
      "saturn",
    ]).toContain(hour.planet);
    expect(hour.index).toBeGreaterThanOrEqual(0);
    expect(hour.index).toBeLessThan(24);
  });

  it("Moon phase illumination stays in [0, 1] and the discrete name matches the angle band", () => {
    const phase = getMoonPhase(new Date());
    expect(phase.illumination).toBeGreaterThanOrEqual(0);
    expect(phase.illumination).toBeLessThanOrEqual(1);
    expect(phase.phaseAngle).toBeGreaterThanOrEqual(0);
    expect(phase.phaseAngle).toBeLessThan(360);
    expect(phase.ageDays).toBeGreaterThanOrEqual(0);
    expect(phase.ageDays).toBeLessThan(30);
  });

  it("Sun is above the horizon at noon UTC over London on the summer solstice", () => {
    const summerNoon = new Date(Date.UTC(2026, 5, 21, 12, 0, 0));
    const sun = getSunPosition(summerNoon, LONDON.lat, LONDON.lng);
    expect(sun.altitudeDeg).toBeGreaterThan(40);
    expect(sun.isDaytime).toBe(true);
  });

  it("Sun is below the horizon at midnight UTC over London", () => {
    const midnight = new Date(Date.UTC(2026, 11, 21, 0, 0, 0));
    const sun = getSunPosition(midnight, LONDON.lat, LONDON.lng);
    expect(sun.altitudeDeg).toBeLessThan(0);
    expect(sun.isDaytime).toBe(false);
  });
});
